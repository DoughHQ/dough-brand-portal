import { cache } from 'react'
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server'
import { createServerSupabaseClient } from './supabase-server'
import { generateBrandHomeNarrative } from '@/lib/brandHome/narrative'

export type PortalUser = {
  portal_user_id: string
  auth_uid: string
  brand_id: number
  role: 'brand_admin' | 'brand_viewer' | 'dough_admin'
  display_name: string | null
  status: string
  onboarding_completed: boolean
  last_login_at: string | null
  login_count: number
}

export type Brand = {
  brand_id: number
  brand_name: string
  brand_name_display: string | null
  brand_website_url: string | null
  has_portal_access: boolean
  logo_url: string | null
  about_text: string | null
  brand_story: string | null
  headquarters_city: string | null
  headquarters_state: string | null
  brand_hq_country_code: string | null
  founded_year: number | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_handle: string | null
  x_handle: string | null
  linkedin_url: string | null
  sustainability_report_url: string | null
  labor_policy_url: string | null
  manufacturing_locations: string | null
}

export type BrandSubscription = {
  subscription_id: string
  brand_id: number
  plan: string
  status: string
  total_sku_limit: number
  /** Always empty from getSubscription — never hydrate the claim array into RSC. */
  claimed_product_ids: number[]
  claimed_sku_count: number
  mrr_cents: number
  trial_ends_at: string | null
  is_founder_rate: boolean
}

export type BrandSnapshot = {
  snapshot_id: number
  brand_id: number
  snapshot_date: string
  weighted_elo_score: number | null
  elo_percentile_in_category: number | null
  category_l1_name: string | null
  elo_velocity_7d: number | null
  elo_velocity_30d: number | null
  momentum_label: 'rising' | 'stable' | 'declining' | null
  total_battles_all_time: number
  total_battles_30d: number
  total_battles_7d: number
  unique_users_battled_30d: number
  total_wins_30d: number
  total_losses_30d: number
  win_rate_30d: number | null
  total_products_in_dough: number
  products_with_battles: number
  top_product_id: number | null
  top_product_elo: number | null
  top_occasions: TopOccasion[]
  audience_summary: AudienceSummary
  compare_group_rank: number | null
  compare_group_size: number | null
  computed_at: string
}

export type TopOccasion = {
  spot_role_id: number
  name: string
  signal_strength: number
  battle_count: number
}

export type AudienceSummary = {
  top_age_band: string | null
  top_age_band_count: number | null
  total_users_with_demographics: number | null
}

export type ProductIntelligence = {
  product_intel_id: number
  product_id: number
  brand_id: number
  global_elo_score: number | null
  elo_percentile: number | null
  taxonomy_node_name: string | null
  elo_velocity_30d: number | null
  total_battles_all_time: number
  total_battles_30d: number
  win_rate_30d: number | null
  occasion_affinity: OccasionAffinity[]
  audience_profile: AudienceProfile
  competitive_narrative: CompetitiveNarrative
}

export type OccasionAffinity = {
  spot_role_id: number
  name: string
  win_rate: number
  battle_count: number
}

export type AudienceProfile = {
  strongest_cohort: string | null
  cohort_win_rate: number | null
  gender_skew: string | null
}

export type CompetitiveNarrative = {
  beats_most: string | null
  loses_to_most: string | null
}

export type CompetitiveSnapshot = {
  focal_brand_rank: number
  compare_group_name: string
  total_brands_in_group: number
  competitive_ladder: CompetitorEntry[]
  category_mean_elo: number | null
  narrative_summary: string | null
  beats_category_types: string[]
  loses_to_category_types: string[]
}

export type CompetitorEntry = {
  rank: number
  label: string
  elo: number
  win_rate_30d: number
  is_focal: boolean
  momentum: string
}

export type BrandProduct = {
  product_id: number
  product_name_clean: string
  product_name_display: string
  product_flavor_variant: string | null
  product_variety: string | null
  image_url: string | null
  total_battles: number
  total_scans: number
  price_tier_label: string | null
  is_verified: boolean
  l3_name: string | null
  l2_name: string | null
  l1_name: string | null
  elo_score: number | null
  battles_total: number
  battles_won: number
  battles_lost: number
  user_percentile: number | null
  is_favorite: boolean
  last_battle_at: string | null
  is_claimed: boolean
}

export const getPortalUser = cache(async (): Promise<PortalUser | null> => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data } = await supabase
    .from('brand_portal_users')
    .select('*')
    .eq('auth_uid', user.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()
  return data as PortalUser | null
})

export const getBrand = cache(async (brandId: number): Promise<Brand | null> => {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('brands')
    .select(`
      brand_id,
      brand_name,
      brand_name_display,
      brand_website_url,
      has_portal_access,
      logo_url,
      about_text,
      brand_story,
      headquarters_city,
      headquarters_state,
      brand_hq_country_code,
      founded_year,
      instagram_handle,
      tiktok_handle,
      youtube_handle,
      x_handle,
      linkedin_url,
      sustainability_report_url,
      labor_policy_url,
      manufacturing_locations
    `)
    .eq('brand_id', brandId)
    .single()
  if (!data) return null
  return { ...data, has_portal_access: data.has_portal_access ?? false } as Brand
})

export const getSubscription = cache(async (brandId: number): Promise<BrandSubscription | null> => {
  const supabase = await createServerSupabaseClient()
  // Never select claimed_product_ids — use claimed_sku_count (chrome/summary) + page-row is_claimed.
  // claimed_sku_count column exists in DB; generated types may lag — read via untyped select.
  const { data } = await supabase
    .from('brand_portal_subscriptions')
    .select(
      'subscription_id, brand_id, plan, status, total_sku_limit, mrr_cents, trial_ends_at, is_founder_rate'
    )
    .eq('brand_id', brandId)
    .single()
  if (!data) return null
  return {
    subscription_id: String(data.subscription_id),
    brand_id: Number(data.brand_id),
    plan: String(data.plan ?? ''),
    status: String(data.status ?? ''),
    total_sku_limit: Number(data.total_sku_limit) || 0,
    claimed_product_ids: [],
    claimed_sku_count: 0,
    mrr_cents: Number(data.mrr_cents) || 0,
    trial_ends_at: data.trial_ends_at == null ? null : String(data.trial_ends_at),
    is_founder_rate: Boolean(data.is_founder_rate),
  }
})

export async function getBrandSnapshot(brandId: number): Promise<BrandSnapshot | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('brand_intelligence_snapshots')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_current', true)
    .single()
  return data as BrandSnapshot | null
}

export async function getBrandSnapshotHistory(
  brandId: number,
  days: number = 30
): Promise<{ snapshot_date: string; weighted_elo_score: number }[]> {
  const supabase = await createServerSupabaseClient()
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data } = await supabase
    .from('brand_intelligence_snapshots')
    .select('snapshot_date, weighted_elo_score')
    .eq('brand_id', brandId)
    .gte('snapshot_date', since.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true })
  return (data ?? []) as { snapshot_date: string; weighted_elo_score: number }[]
}

export async function getProductIntelligence(
  brandId: number,
  claimedProductIds: number[]
): Promise<ProductIntelligence[]> {
  if (!claimedProductIds.length) return []
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('brand_product_intelligence')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_current', true)
    .in('product_id', claimedProductIds)
    .order('global_elo_score', { ascending: false })
  return (data ?? []) as unknown as ProductIntelligence[]
}

export async function getAllBrandProducts(_brandId: number): Promise<never> {
  throw new Error(
    'FORBIDDEN: getAllBrandProducts is a catalog landmine. Use list_brand_products_page or get_brand_home_snapshot.'
  )
}

/**
 * @deprecated FORBIDDEN on Home/layout — landmine.
 * Live COUNT(*) on products. Use brand_home_catalog_stats / get_brand_home_snapshot pulse.
 */
export async function getBrandProductCount(_brandId: number): Promise<never> {
  throw new Error(
    'FORBIDDEN: getBrandProductCount is a live COUNT landmine. Use brand_home_catalog_stats / get_brand_home_snapshot.'
  )
}

/** Top products by battles for Brand Home — never the full catalog. */
export async function getTopBrandProducts(
  brandId: number,
  limit = 24
): Promise<
  {
    product_id: number
    product_name_display: string
    taxonomy_node_id: number | null
    total_battles: number
    status: string
    l2_name: string | null
  }[]
> {
  const supabase = await createServerSupabaseClient()
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit)), 48)
  const { data } = await supabase
    .from('products')
    .select(
      `
      product_id,
      product_name_display,
      taxonomy_node_id,
      total_battles,
      status,
      taxonomy_nodes!products_taxonomy_node_id_fkey (
        node_name_display
      )
    `
    )
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .eq('is_suppressed', false)
    .order('total_battles', { ascending: false })
    .limit(safeLimit)
  if (!data) return []
  return data.map((row: any) => ({
    product_id: row.product_id,
    product_name_display: row.product_name_display,
    taxonomy_node_id: row.taxonomy_node_id,
    total_battles: row.total_battles ?? 0,
    status: row.status,
    l2_name: row.taxonomy_nodes?.node_name_display ?? null,
  }))
}

/** Names/battles for a small id set (claimed SKUs) — not a catalog scan. */
export async function getBrandProductsByIds(
  brandId: number,
  productIds: number[]
): Promise<{ product_id: number; product_name_display: string; total_battles: number }[]> {
  if (!productIds.length) return []
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('products')
    .select('product_id, product_name_display, total_battles')
    .eq('brand_id', brandId)
    .in('product_id', productIds.slice(0, 200))
  return (data ?? []).map((row) => ({
    product_id: Number(row.product_id),
    product_name_display: String(row.product_name_display ?? `Product ${row.product_id}`),
    total_battles: Number(row.total_battles) || 0,
  }))
}

/** @deprecated FORBIDDEN — throws. Use list_brand_products_page. */
export async function getBrandProducts(
  _brandId: number,
  _claimedProductIds: number[]
): Promise<never> {
  throw new Error(
    'FORBIDDEN: getBrandProducts is a catalog landmine. Use list_brand_products_page.'
  )
}

export async function getCompetitiveSnapshot(
  brandId: number
): Promise<CompetitiveSnapshot | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('brand_competitive_snapshots')
    .select('*')
    .eq('focal_brand_id', brandId)
    .eq('is_current', true)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single()
  return data as unknown as CompetitiveSnapshot | null
}

export function generateNarrative(
  snapshot: BrandSnapshot,
  brandName: string,
  /** Ledger total from get_brand_total_battles — not snapshot.total_battles_all_time. */
  totalBattles: number
): { headline: string; sub: string } {
  return generateBrandHomeNarrative(snapshot, brandName, totalBattles)
}

export type PlatformStats = {
  active_brands: number
  active_products: number
  total_battles: number
  battles_7d: number
  total_scans: number
  scans_7d: number
  total_users: number
  active_users_7d: number
  products_with_elo: number
  avg_decision_ms: number
}

export type BrandSearchResult = {
  brand_id: number
  brand_name: string
  product_count: number
  battle_count: number
  top_elo: number | null
}

export async function getPlatformStats(): Promise<never> {
  throw new Error(
    'FORBIDDEN: getPlatformStats is an Admin Home landmine. Use get_admin_home_snapshot.'
  )
}

export type AdminProductSearchResult = {
  product_id: number
  product_name_clean: string
  brand_name: string
  brand_id: number
  l2_name: string | null
  l3_name: string | null
  battles_total: number
  win_rate_pct: number | null
  elo_score: number | null
  milestone: string
  image_url: string | null
  // --- appended for the box builder (focal-first category resolution) ---
  taxonomy_node_id: number | null
  l2_node_id: number | null
  l1_name: string | null
}

export async function searchProductsAdmin(query: string): Promise<AdminProductSearchResult[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('search_products_admin', { p_query: query })
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('searchProductsAdmin unavailable:', error.message || error.code)
    }
    return []
  }
  return (data ?? []) as AdminProductSearchResult[]
}

export async function searchBrands(query: string): Promise<BrandSearchResult[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('search_brands_admin', { p_query: query })
  if (!data) return []
  return (data as any[]).map(r => ({
    brand_id: r.brand_id,
    brand_name: r.brand_name,
    product_count: Number(r.product_count),
    battle_count: Number(r.battle_count),
    top_elo: r.top_elo ? Number(r.top_elo) : null,
  }))
}

export type CategoryStat = {
  l1_name: string
  l2_name: string
  total_products: number
  products_with_battles: number
  total_battles: number
  brands_represented: number
  top_elo: number | null
  avg_elo: number | null
  battle_density_pct: number
}

export type MilestoneAlert = {
  alert_id: number
  product_id: number
  brand_id: number
  milestone_type: string
  battles_at_trigger: number
  win_rate_at_trigger: number | null
  elo_at_trigger: number | null
  triggered_at: string
  outreach_sent_at: string | null
  products: { product_name_clean: string } | null
  brands: { brand_name: string } | null
}

export async function getPlatformCategoryStats(): Promise<CategoryStat[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_platform_category_stats')
  if (error) console.error('getPlatformCategoryStats error:', error)
  return (data ?? []) as CategoryStat[]
}

export async function getMilestoneAlerts(): Promise<MilestoneAlert[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('product_milestone_alerts')
    .select(`
      alert_id,
      product_id,
      brand_id,
      milestone_type,
      battles_at_trigger,
      win_rate_at_trigger,
      elo_at_trigger,
      triggered_at,
      outreach_sent_at,
      products:product_id(product_name_clean),
      brands:brand_id(brand_name)
    `)
    .is('outreach_sent_at', null)
    .order('triggered_at', { ascending: false })
    .limit(20)

  if (error) {
    // Table may be absent or RLS-blocked in some environments; admin products still renders.
    if (process.env.NODE_ENV === 'development') {
      console.warn('getMilestoneAlerts unavailable:', error.message || error.code || error)
    }
    return []
  }

  return (data ?? []) as unknown as MilestoneAlert[]
}
