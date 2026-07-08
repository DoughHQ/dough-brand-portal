import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AttributeSignalRow,
  MissionReportLoadResult,
  MissionReportRow,
  ProvenanceComposition,
} from './types'

function parseAttributeSignals(raw: unknown): AttributeSignalRow[] {
  if (!Array.isArray(raw)) return []
  return raw as AttributeSignalRow[]
}

function parseProvenance(raw: unknown): ProvenanceComposition {
  if (raw == null || typeof raw !== 'object') return {}
  return raw as ProvenanceComposition
}

/**
 * Load current mission report via RLS-scoped table select (authenticated session).
 */
export async function fetchMissionReport(
  supabase: SupabaseClient,
  missionId: string
): Promise<MissionReportLoadResult> {
  const { data, error } = await supabase
    .from('brand_mission_reports')
    .select(
      'focal_product_id, snapshot_date, total_completions, effective_k_threshold, min_cell_size_met, elo_win_rate, attribute_signals, provenance_composition, engagement_bias_disclosure, computed_at'
    )
    .eq('mission_id', missionId)
    .eq('is_current', true)
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message }
  }

  if (!data) {
    return { ok: true, report: null, focalProductName: null }
  }

  const row = data as Record<string, unknown>
  const report: MissionReportRow = {
    focal_product_id: Number(row.focal_product_id),
    snapshot_date: String(row.snapshot_date),
    total_completions: Number(row.total_completions ?? 0),
    effective_k_threshold: Number(row.effective_k_threshold ?? 0),
    min_cell_size_met: Boolean(row.min_cell_size_met),
    elo_win_rate:
      row.elo_win_rate != null ? Number(row.elo_win_rate) : null,
    attribute_signals: parseAttributeSignals(row.attribute_signals),
    provenance_composition: parseProvenance(row.provenance_composition),
    engagement_bias_disclosure: String(row.engagement_bias_disclosure ?? ''),
    computed_at: String(row.computed_at),
  }

  const productIds = new Set<number>([report.focal_product_id])
  for (const sig of report.attribute_signals) {
    if (sig.opponent_product_id) productIds.add(sig.opponent_product_id)
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('product_id, product_name_short, product_name_display')
    .in('product_id', [...productIds])

  if (productsError) {
    return { ok: false, error: productsError.message }
  }

  const focal = (products ?? []).find(
    (p) => Number((p as { product_id: number }).product_id) === report.focal_product_id
  ) as { product_name_short?: string | null; product_name_display?: string | null } | undefined

  const focalProductName =
    focal?.product_name_short ?? focal?.product_name_display ?? null

  return { ok: true, report, focalProductName }
}
