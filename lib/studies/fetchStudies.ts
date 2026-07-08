import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CampaignRow,
  MissionRow,
  MissionReportRow,
  ProductRow,
  StudiesLoadResult,
} from './types'

/**
 * Load studies index for a single brand.
 * Portal reads are explicitly scoped by brandId — do not rely on RLS width
 * (brand_campaigns SELECT is open to all authenticated users).
 */
export async function fetchStudiesIndex(
  supabase: SupabaseClient,
  brandId: number
): Promise<StudiesLoadResult> {
  const { data: campaigns, error: campaignsError } = await supabase
    .from('brand_campaigns')
    .select('id, name, campaign_code, description, starts_at')
    .eq('brand_id', brandId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false })

  if (campaignsError) {
    return { ok: false, securityViolation: false, error: campaignsError.message }
  }

  const campaignList = (campaigns ?? []) as CampaignRow[]
  const campaignIds = campaignList.map((c) => c.id)

  if (campaignIds.length === 0) {
    return {
      ok: true,
      campaigns: campaignList,
      missionsByCampaign: {},
      reportsByMission: {},
      productsById: {},
    }
  }

  const { data: missions, error: missionsError } = await supabase
    .from('missions')
    .select('id, title, status, product_id, starts_at, expires_at, brand_campaign_id')
    .in('brand_campaign_id', campaignIds)

  if (missionsError) {
    return { ok: false, securityViolation: false, error: missionsError.message }
  }

  const missionList = (missions ?? []) as MissionRow[]
  const missionIds = missionList.map((m) => m.id)

  let reportList: MissionReportRow[] = []
  if (missionIds.length > 0) {
    const { data: reports, error: reportsError } = await supabase
      .from('brand_mission_reports')
      .select('mission_id, elo_win_rate, total_completions, min_cell_size_met, snapshot_date')
      .in('mission_id', missionIds)
      .eq('is_current', true)

    if (reportsError) {
      return { ok: false, securityViolation: false, error: reportsError.message }
    }
    reportList = (reports ?? []) as MissionReportRow[]
  }

  const productIds = [
    ...new Set(
      missionList
        .map((m) => m.product_id)
        .filter((id): id is number => id != null)
    ),
  ]

  let productList: ProductRow[] = []
  if (productIds.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('product_id, product_name_short, brand_id')
      .in('product_id', productIds)

    if (productsError) {
      return { ok: false, securityViolation: false, error: productsError.message }
    }
    productList = (products ?? []) as ProductRow[]
  }

  const foreignProducts = productList.filter((p) => p.brand_id !== brandId)
  if (foreignProducts.length > 0) {
    return {
      ok: false,
      securityViolation: true,
      detail: `Mission product rows reference brand_id(s): ${[
        ...new Set(foreignProducts.map((p) => p.brand_id)),
      ].join(', ')}. Expected only ${brandId}. Halting — possible data integrity issue.`,
    }
  }

  const missionsByCampaign: Record<string, MissionRow[]> = {}
  for (const m of missionList) {
    if (!missionsByCampaign[m.brand_campaign_id]) {
      missionsByCampaign[m.brand_campaign_id] = []
    }
    missionsByCampaign[m.brand_campaign_id].push(m)
  }

  const reportsByMission: Record<string, MissionReportRow> = {}
  for (const r of reportList) {
    reportsByMission[r.mission_id] = r
  }

  const productsById: Record<number, ProductRow> = {}
  for (const p of productList) {
    productsById[p.product_id] = p
  }

  return {
    ok: true,
    campaigns: campaignList,
    missionsByCampaign,
    reportsByMission,
    productsById,
  }
}
