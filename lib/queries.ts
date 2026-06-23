import { createServerSupabaseClient as createClient } from '@/lib/supabase-server'
import { createServerSupabaseClient } from './supabase-server'
import { MISSION_TYPE_MAP } from '@/lib/ihut/constants'

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

export type ProductDetail = {
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
  brand_id: number
  brand_name: string
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
}

export type ProductBattleHistory = {
  battle_date: string
  battles: number
  wins: number
  losses: number
  avg_decision_ms: number
}

export async function getPortalUser(): Promise<PortalUser | null> {
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
  return data
}

export async function getBrand(brandId: number): Promise<Brand | null> {
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
    .select(`
      product_id,
      product_name_display,
      taxonomy_node_id,
      total_battles,
      status,
      taxonomy_nodes!products_taxonomy_node_id_fkey (
        node_name_display,
        parent_taxonomy_node_id
      )
    `)
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .eq('is_suppressed', false)
    .order('total_battles', { ascending: false })
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

export async function getBrandProductCount(brandId: number): Promise<number> {
  const supabase = await createServerSupabaseClient()
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .eq('is_suppressed', false)
  return count ?? 0
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

export async function getProductDetail(
  productId: number,
  brandId: number
): Promise<ProductDetail | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_product_detail', {
    p_product_id: productId,
    p_brand_id: brandId,
  })
  if (!data || !data.length) return null
  const row = data[0] as any
  return {
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
    brand_id: row.brand_id,
    brand_name: row.brand_name,
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
  }
}

export async function getProductBattleHistory(
  productId: number
): Promise<ProductBattleHistory[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_product_battle_history', {
    p_product_id: productId,
  })
  if (!data) return []
  return (data as any[]).map(row => ({
    battle_date: row.battle_date,
    battles: row.battles,
    wins: row.wins,
    losses: row.losses,
    avg_decision_ms: Math.round(Number(row.avg_decision_ms)),
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

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_platform_stats')
  if (!data || !data.length) return {
    active_brands: 0, active_products: 0, total_battles: 0,
    battles_7d: 0, total_scans: 0, scans_7d: 0, total_users: 0,
    active_users_7d: 0, products_with_elo: 0, avg_decision_ms: 0,
  }
  const r = data[0] as any
  return {
    active_brands: Number(r.active_brands),
    active_products: Number(r.active_products),
    total_battles: Number(r.total_battles),
    battles_7d: Number(r.battles_7d),
    total_scans: Number(r.total_scans),
    scans_7d: Number(r.scans_7d),
    total_users: Number(r.total_users),
    active_users_7d: Number(r.active_users_7d),
    products_with_elo: Number(r.products_with_elo),
    avg_decision_ms: Number(r.avg_decision_ms),
  }
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
  if (error) console.error('getMilestoneAlerts error:', error)
  return (data ?? []) as unknown as MilestoneAlert[]
}

// ---------------------------------------------------------------------------
// IHUT / campaign
// ---------------------------------------------------------------------------

export type QuestionType = {
  code: string
  display_name: string
  requires_products: boolean
  min_products: number | null
  max_products: number | null
  is_brand_configurable: boolean
  sort_order: number
}

export type ProtocolQuestionRow = {
  protocol_id: string
  question_type_code: string
  session_number: number
  position: number
  label: string | null
  config: object
  selection_strategy: string | null
  selection_config: object
  is_required: boolean
}

export async function getFocalProductTaxonomyNode(productId: number): Promise<number | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('products')
    .select('taxonomy_node_id')
    .eq('product_id', productId)
    .single()
  if (error) console.error('getFocalProductTaxonomyNode error:', error)
  return data?.taxonomy_node_id ?? null
}

export type ChallengerProductResult = {
  product_id: number
  product_name_display: string
  brand_id: number
  brand_name: string
  total_battles: number
}

export async function searchChallengerProducts(
  query: string,
  excludeBrandId: number,
  excludeProductId: number | null,
  limit = 20
): Promise<ChallengerProductResult[]> {
  const supabase = await createServerSupabaseClient()
  let builder = supabase
    .from('products')
    .select('product_id, product_name_display, brand_id, total_battles, brands!inner(brand_name)')
    .neq('brand_id', excludeBrandId)
    .eq('status', 'active')
    .eq('is_suppressed', false)
    .ilike('product_name_display', `%${query}%`)
    .order('total_battles', { ascending: false })
    .limit(limit)
  if (excludeProductId) builder = builder.neq('product_id', excludeProductId)
  const { data, error } = await builder
  if (error) {
    console.error('searchChallengerProducts error:', error)
    return []
  }
  return (data ?? []).map((row: any) => ({
    product_id: row.product_id,
    product_name_display: row.product_name_display,
    brand_id: row.brand_id,
    brand_name: row.brands?.brand_name ?? '',
    total_battles: row.total_battles ?? 0,
  }))
}

export type BrandMissionListItem = {
  mission_id: string
  campaign_id: string
  status: string
  mission_type: string
  campaign_objective: string
  product_name: string | null
  title: string
  created_at: string
}

export async function getBrandMissions(brandId: number): Promise<BrandMissionListItem[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select(`
      id,
      status,
      mission_type,
      campaign_objective,
      title,
      created_at,
      brand_campaign_id,
      products:product_id(product_name_display),
      brand_campaigns!inner(brand_id)
    `)
    .eq('brand_campaigns.brand_id', brandId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getBrandMissions error:', error)
    return []
  }
  return (data ?? []).map((row: any) => ({
    mission_id: row.id,
    campaign_id: row.brand_campaign_id,
    status: row.status,
    mission_type: row.mission_type,
    campaign_objective: row.campaign_objective,
    product_name: row.products?.product_name_display ?? null,
    title: row.title,
    created_at: row.created_at,
  }))
}

export type MissionWizardDraft = {
  campaignId: string
  missionId: string
  protocolId: string
  missionType: 'discovery' | 'positioning' | 'head_to_head'
  focalProductId: string | null
  focalProductTaxonomyNodeId: number | null
  focalProductName: string | null
  targetCompletions: number
  payoutPerUserCents: number
  targeting: {
    states: string[]
    minCategoryBattles: number
    newToBrandOnly: boolean
    recentPurchaseOnly: boolean
  }
  questions: Array<{
    _id: string
    question_type_code: string
    session_number: 1 | 2
    position: number
    label: string | null
    config: object
    selection_strategy: string | null
    selection_config: object
    is_required: boolean
  }>
}

export async function getMissionWizardDraft(
  missionId: string,
  brandId: number
): Promise<MissionWizardDraft | null> {
  const supabase = await createServerSupabaseClient()

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select(`
      id,
      mission_type,
      campaign_objective,
      product_id,
      taxonomy_node_id,
      max_claims,
      platform_reward_value,
      require_new_trial,
      brand_campaign_id,
      products:product_id(product_name_display),
      brand_campaigns!inner(brand_id)
    `)
    .eq('id', missionId)
    .eq('brand_campaigns.brand_id', brandId)
    .is('deleted_at', null)
    .single()
  if (missionError || !mission) return null

  const { data: protocol } = await supabase
    .from('mission_protocols')
    .select('id')
    .eq('mission_id', missionId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!protocol) return null

  const { data: eligibility } = await supabase
    .from('mission_eligibility_rules')
    .select('target_states, min_category_battles, max_days_since_last_purchase')
    .eq('mission_id', missionId)
    .maybeSingle()

  const { data: brandQuestions } = await supabase
    .from('protocol_questions')
    .select('id, question_type_code, session_number, position, label, config, selection_strategy, selection_config, is_required')
    .eq('protocol_id', protocol.id)
    .eq('is_required', false)
    .order('session_number')
    .order('position')

  let missionType: MissionWizardDraft['missionType'] | null = null
  if (mission.mission_type === 'product_discovery') missionType = 'discovery'
  else if (mission.mission_type === 'brand_challenge' && mission.campaign_objective === 'depth') missionType = 'positioning'
  else if (mission.mission_type === 'brand_challenge' && mission.campaign_objective === 'conquest') missionType = 'head_to_head'
  if (!missionType) return null

  return {
    campaignId: mission.brand_campaign_id,
    missionId: mission.id,
    protocolId: protocol.id,
    missionType,
    focalProductId: mission.product_id ? String(mission.product_id) : null,
    focalProductTaxonomyNodeId: mission.taxonomy_node_id ?? null,
    focalProductName: (mission.products as any)?.product_name_display ?? null,
    targetCompletions: mission.max_claims ?? 30,
    payoutPerUserCents: mission.platform_reward_value
      ? Math.round(Number(mission.platform_reward_value) * 100)
      : 600,
    targeting: {
      states: eligibility?.target_states ?? [],
      minCategoryBattles: eligibility?.min_category_battles ?? 0,
      newToBrandOnly: mission.require_new_trial ?? false,
      recentPurchaseOnly: (eligibility?.max_days_since_last_purchase ?? 0) > 0,
    },
    questions: (brandQuestions ?? []).map((q: any) => ({
      _id: q.id,
      question_type_code: q.question_type_code,
      session_number: q.session_number as 1 | 2,
      position: q.position,
      label: q.label,
      config: q.config ?? {},
      selection_strategy: q.selection_strategy,
      selection_config: q.selection_config ?? {},
      is_required: false,
    })),
  }
}

export async function getEligiblePool(
  states: string[] | null,
  newToBrandId: number | null,
  taxonomyNodeId: number | null
): Promise<number> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('count_eligible_users', {
    p_target_states: states,
    p_new_to_brand_id: newToBrandId,
    p_taxonomy_node_id: taxonomyNodeId,
  })
  if (error) console.error('getEligiblePool error:', error)
  return typeof data === 'number' ? data : 0
}

export async function getQuestionTypes(): Promise<QuestionType[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('question_types')
    .select('code, display_name, requires_products, min_products, max_products, is_brand_configurable, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  if (error) console.error('getQuestionTypes error:', error)
  return (data ?? []) as QuestionType[]
}

export async function createCampaignDraft(
  brandId: number,
  _portalUserAuthUid: string,
  wizardStudyType: 'discovery' | 'positioning' | 'head_to_head',
  focalProductId: number,
  taxonomyNodeId: number
): Promise<{ campaignId: string; missionId: string; protocolId: string }> {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase.rpc('create_campaign_draft', {
    p_brand_id: brandId,
    p_campaign_name: 'Draft campaign',
    p_mission_title: 'Draft',
    p_mission_type: MISSION_TYPE_MAP[wizardStudyType],
    p_operator_type: 'brand',
    p_product_id: focalProductId,
    p_taxonomy_node_id: taxonomyNodeId,
    p_session_count: 2,
    p_session2_interval_hours: 24,
    p_starts_at: now.toISOString(),
    p_expires_at: expiresAt.toISOString(),
  })
  if (error) throw new Error(error.message)

  const result = data as { campaign_id: string; mission_id: string; protocol_id: string }
  return {
    campaignId: String(result.campaign_id),
    missionId: String(result.mission_id),
    protocolId: String(result.protocol_id),
  }
}

export async function upsertProtocolQuestions(
  protocolId: string,
  questions: ProtocolQuestionRow[]
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error: deleteError } = await supabase
    .from('protocol_questions')
    .delete()
    .eq('protocol_id', protocolId)
    .eq('is_required', false)
  if (deleteError) console.error('upsertProtocolQuestions delete error:', deleteError)

  const brandQuestions = questions.filter((q) => !q.is_required)
  const spineQuestions = questions.filter((q) => q.is_required)

  if (brandQuestions.length) {
    const { error: insertError } = await supabase
      .from('protocol_questions')
      .insert(brandQuestions)
    if (insertError) throw new Error('Failed to insert protocol questions: ' + insertError.message)
  }

  if (spineQuestions.length) {
    const { error: spineError } = await supabase
      .from('protocol_questions')
      .upsert(spineQuestions, { ignoreDuplicates: true })
    if (spineError) console.error('upsertProtocolQuestions spine error:', spineError)
  }
}
