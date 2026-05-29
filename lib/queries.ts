import { createServerSupabaseClient } from './supabase-server'

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
  brand_website_url: string | null
  has_portal_access: boolean
}

export type BrandSubscription = {
  subscription_id: string
  brand_id: number
  plan: string
  status: string
  total_sku_limit: number
  claimed_product_ids: number[]
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

export async function getPortalUser(): Promise<PortalUser | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('brand_portal_users')
    .select('*')
    .eq('auth_uid', user.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()
  return data
}

export async function getBrand(brandId: number): Promise<Brand | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('brands')
    .select('brand_id, brand_name, brand_website_url, has_portal_access')
    .eq('brand_id', brandId)
    .single()
  return data
}

export async function getSubscription(brandId: number): Promise<BrandSubscription | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('brand_portal_subscriptions')
    .select('*')
    .eq('brand_id', brandId)
    .single()
  return data
}

export async function getBrandSnapshot(brandId: number): Promise<BrandSnapshot | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('brand_intelligence_snapshots')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_current', true)
    .single()
  return data
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
  return data ?? []
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
  return data ?? []
}

export async function getAllBrandProducts(brandId: number) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('products')
    .select('product_id, product_name_display, taxonomy_node_id, total_battles, status')
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .eq('is_suppressed', false)
    .order('total_battles', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function getBrandProducts(
  brandId: number,
  claimedProductIds: number[]
): Promise<BrandProduct[]> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase.rpc('get_brand_products_with_taxonomy', {
    p_brand_id: brandId,
  }).range(0, 9999)

  if (!data) return []

  return (data as any[]).map((row) => ({
    product_id: row.product_id,
    product_name_clean: row.product_name_clean ?? row.product_name_display,
    product_name_display: row.product_name_display,
    product_flavor_variant: row.product_flavor_variant,
    product_variety: row.product_variety,
    image_url: row.image_url,
    total_battles: row.total_battles ?? 0,
    total_scans: row.total_scans ?? 0,
    price_tier_label: row.price_tier_label,
    is_verified: row.is_verified ?? false,
    l3_name: row.l3_name,
    l2_name: row.l2_name,
    l1_name: row.l1_name,
    elo_score: row.elo_score ? Number(row.elo_score) : null,
    battles_total: row.battles_total ?? 0,
    battles_won: row.battles_won ?? 0,
    battles_lost: row.battles_lost ?? 0,
    user_percentile: row.user_percentile ? Number(row.user_percentile) : null,
    is_favorite: row.is_favorite ?? false,
    last_battle_at: row.last_battle_at ?? null,
    is_claimed: claimedProductIds.includes(row.product_id),
  }))
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
  return data
}

export function generateNarrative(
  snapshot: BrandSnapshot,
  brandName: string
): { headline: string; sub: string } {
  const delta30 = snapshot.elo_velocity_30d ?? 0
  const winRate = snapshot.win_rate_30d ?? 0
  const momentum = snapshot.momentum_label
  if (delta30 > 20 && momentum === 'rising') {
    return {
      headline: `${brandName} is having its best 30 days since joining Dough — up ${Math.round(delta30)} points and winning ${Math.round(winRate * 100)}% of battles.`,
      sub: `Strongest momentum in its category this month · Updated daily`
    }
  }
  if (delta30 > 5 && momentum === 'rising') {
    return {
      headline: `${brandName} is gaining ground — up ${Math.round(delta30)} ELO points over the last 30 days.`,
      sub: `Win rate ${Math.round(winRate * 100)}% · ${snapshot.total_battles_30d} battles this month · Updated daily`
    }
  }
  if (delta30 < -10 && momentum === 'declining') {
    return {
      headline: `${brandName}'s preference score has dipped ${Math.abs(Math.round(delta30))} points this month.`,
      sub: `Win rate down to ${Math.round(winRate * 100)}% · See the full breakdown below · Updated daily`
    }
  }
  if (winRate > 0.65 && momentum === 'stable') {
    return {
      headline: `${brandName} is holding strong — winning ${Math.round(winRate * 100)}% of head-to-head battles.`,
      sub: `${snapshot.total_battles_30d} battles this month · Category rank #${snapshot.compare_group_rank ?? '—'} · Updated daily`
    }
  }
  if (snapshot.total_battles_all_time < 50) {
    return {
      headline: `${brandName} is getting started on Dough. Early data is coming in.`,
      sub: `${snapshot.total_battles_all_time} battles counted so far · Data updates daily`
    }
  }
  return {
    headline: `${brandName} has completed ${snapshot.total_battles_all_time.toLocaleString()} battles on Dough.`,
    sub: `${snapshot.total_battles_30d} battles in the last 30 days · Updated daily`
  }
}
