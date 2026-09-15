import type { CatalogHealth } from '@/lib/brandHome/catalogHealth'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import type {
  BrandHomeModel,
  HomeCategoryCard,
  HomeHero,
  HomePulseItem,
  HomeStudyRow,
} from '@/lib/brandHome/selectHomeModel'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import { studyHref } from '@/lib/brandHome/selectHomeModel'
import type { Brand, BrandSnapshot, TopOccasion } from '@/lib/queries'
import { generateBrandHomeNarrative } from '@/lib/brandHome/narrative'

export type BrandPortalChrome = {
  brandId: number
  brandName: string
  claimedSkuCount: number
  /** Active catalog products for workspace chrome (not subscription claims). */
  catalogProductCount: number
  plan: string | null
}

export type BrandHomeIntelStub = {
  eloVelocity30d: number | null
  winRate30d: number | null
  momentumLabel: 'rising' | 'stable' | 'declining' | null
  totalBattles30d: number
  totalBattlesAllTime: number
  compareGroupRank: number | null
  topOccasions: TopOccasion[]
}

export type BrandHomeSnapshotDoc = {
  generatedAt: string
  catalogRefreshedAt: string | null
  /** False when pulse came from live fallback (cold dirty / lying zeros). */
  catalogReady: boolean
  chrome: BrandPortalChrome
  brand: Brand
  intel: BrandHomeIntelStub | null
  narrative: { headline: string; sub: string }
  /** Partial BrandSnapshot for legacy DashboardClient "More" section. */
  snapshot: BrandSnapshot | null
  pulse: {
    productCount: number
    battledCount: number
    totalBattles: number
    openStudies: number
    gainingCount: number
    domainVerified: boolean
    categoryCount: number
  }
  catalogHealth: CatalogHealth
  signalCards: ProductSignalCardModel[]
  categoriesTop: HomeCategoryCard[]
  l2NodeIds: number[]
  homeModel: BrandHomeModel
  parentDisplayName: string | null
  pendingOwnership: boolean
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function asNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function asNumOrNull(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function asStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v)
  return s.length > 0 ? s : null
}

function asBool(v: unknown): boolean {
  return v === true
}

function metric(have: unknown, total: unknown): { have: number; total: number } {
  const t = asNum(total)
  const h = Math.min(t, Math.max(0, asNum(have)))
  return { have: h, total: t }
}

export function parseBrandPortalChrome(raw: unknown): BrandPortalChrome | null {
  const r = asRecord(raw)
  if (!r) return null
  const brandId = asNum(r.brand_id)
  const brandName = asStr(r.brand_name)
  if (!Number.isFinite(brandId) || brandId <= 0 || !brandName) return null
  return {
    brandId,
    brandName,
    claimedSkuCount: asNum(r.claimed_sku_count),
    catalogProductCount: asNum(r.catalog_product_count ?? r.product_count),
    plan: asStr(r.plan),
  }
}

function parseBrandStub(raw: unknown, chrome: BrandPortalChrome): Brand | null {
  const r = asRecord(raw)
  if (!r) return null
  const brandId = asNum(r.brand_id)
  const brandName = asStr(r.brand_name) || chrome.brandName
  if (!Number.isFinite(brandId) || brandId <= 0 || !brandName) return null
  return {
    brand_id: brandId,
    brand_name: brandName,
    brand_name_display: asStr(r.brand_name_display),
    brand_website_url: asStr(r.brand_website_url),
    has_portal_access: asBool(r.has_portal_access),
    logo_url: asStr(r.logo_url),
    about_text: asStr(r.about_text),
    brand_story: asStr(r.brand_story),
    headquarters_city: asStr(r.headquarters_city),
    headquarters_state: asStr(r.headquarters_state),
    brand_hq_country_code: asStr(r.brand_hq_country_code),
    founded_year: asNumOrNull(r.founded_year),
    instagram_handle: asStr(r.instagram_handle),
    tiktok_handle: asStr(r.tiktok_handle),
    youtube_handle: asStr(r.youtube_handle),
    x_handle: asStr(r.x_handle),
    linkedin_url: asStr(r.linkedin_url),
    sustainability_report_url: asStr(r.sustainability_report_url),
    labor_policy_url: asStr(r.labor_policy_url),
    manufacturing_locations: asStr(r.manufacturing_locations),
  }
}

function parseTopOccasions(raw: unknown): TopOccasion[] {
  if (!Array.isArray(raw)) return []
  const out: TopOccasion[] = []
  for (const item of raw) {
    const r = asRecord(item)
    if (!r) continue
    const name = asStr(r.name)
    if (!name) continue
    out.push({
      spot_role_id: asNum(r.spot_role_id),
      name,
      signal_strength: asNum(r.signal_strength),
      battle_count: asNum(r.battle_count),
    })
  }
  return out
}

function parseIntel(raw: unknown): BrandHomeIntelStub | null {
  const r = asRecord(raw)
  if (!r) return null
  const momentum = asStr(r.momentum_label)
  const momentumLabel =
    momentum === 'rising' || momentum === 'stable' || momentum === 'declining' ? momentum : null
  return {
    eloVelocity30d: asNumOrNull(r.elo_velocity_30d),
    winRate30d: asNumOrNull(r.win_rate_30d),
    momentumLabel,
    totalBattles30d: asNum(r.total_battles_30d),
    totalBattlesAllTime: asNum(r.total_battles_all_time),
    compareGroupRank: asNumOrNull(r.compare_group_rank),
    topOccasions: parseTopOccasions(r.top_occasions),
  }
}

function intelToSnapshot(brandId: number, intel: BrandHomeIntelStub): BrandSnapshot {
  return {
    snapshot_id: 0,
    brand_id: brandId,
    snapshot_date: new Date().toISOString().slice(0, 10),
    weighted_elo_score: null,
    elo_percentile_in_category: null,
    category_l1_name: null,
    elo_velocity_7d: null,
    elo_velocity_30d: intel.eloVelocity30d,
    momentum_label: intel.momentumLabel,
    total_battles_all_time: intel.totalBattlesAllTime,
    total_battles_30d: intel.totalBattles30d,
    total_battles_7d: 0,
    unique_users_battled_30d: 0,
    total_wins_30d: 0,
    total_losses_30d: 0,
    win_rate_30d: intel.winRate30d,
    total_products_in_dough: 0,
    products_with_battles: 0,
    top_product_id: null,
    top_product_elo: null,
    top_occasions: intel.topOccasions,
    audience_summary: {
      top_age_band: null,
      top_age_band_count: null,
      total_users_with_demographics: null,
    },
    compare_group_rank: intel.compareGroupRank,
    compare_group_size: null,
    computed_at: new Date().toISOString(),
  }
}

function parseSignalCards(raw: unknown): ProductSignalCardModel[] {
  if (!Array.isArray(raw)) return []
  const out: ProductSignalCardModel[] = []
  for (const item of raw) {
    const r = asRecord(item)
    if (!r) continue
    const productId = asNum(r.product_id)
    if (!Number.isFinite(productId) || productId <= 0) continue
    const name = asStr(r.name) || `Product ${productId}`
    const category = asStr(r.category)
    const unlocked = asBool(r.standing_unlocked)
    const rankLabel = asStr(r.standing_rank_label)
    const tooltip =
      asStr(r.standing_tooltip) ||
      `See where ${name} ranks among ${category ?? 'category'} tasters once enough people have compared it.`
    out.push({
      productId,
      name,
      category,
      imageUrl: asStr(r.image_url),
      comparisonEvents: asNum(r.comparison_events),
      href: `/products/${productId}`,
      standing: {
        unlocked: unlocked && rankLabel != null,
        rankLabel: unlocked ? rankLabel : null,
        tooltip,
      },
    })
  }
  return out
}

function parseCategoriesTop(raw: unknown): HomeCategoryCard[] {
  if (!Array.isArray(raw)) return []
  const out: HomeCategoryCard[] = []
  for (const item of raw) {
    const r = asRecord(item)
    if (!r) continue
    const l2 = asNum(r.l2_node_id)
    const name = asStr(r.name)
    if (!Number.isFinite(l2) || l2 <= 0 || !name) continue
    const unlocked = asBool(r.unlocked)
    const battled = asNum(r.products_with_battles)
    out.push({
      l2NodeId: l2,
      name,
      status: battled > 0 ? 'active' : 'building',
      detail: battled > 0 ? `${battled.toLocaleString()} with battles` : 'In your catalog',
      href: brandCategoryOverviewHref(l2),
      unlocked,
      ctaLabel: unlocked ? 'Open' : 'Preview',
      bannerImageUrl: asStr(r.banner_image_url),
    })
  }
  return out
}

function parseL2NodeIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  const out: number[] = []
  for (const item of raw) {
    const n = asNum(item)
    if (Number.isFinite(n) && n > 0) out.push(n)
  }
  return out
}

function studyRowFromHighlight(raw: unknown): HomeStudyRow | null {
  const r = asRecord(raw)
  if (!r) return null
  const id = asStr(r.id)
  const title = asStr(r.title)
  if (!id || !title) return null
  const lifecycle = (asStr(r.lifecycle_state) ?? 'active') as HomeStudyRow extends never ? never : string
  const missionType = asStr(r.mission_type)
  const { href, ctaLabel } = studyHref({
    mission_id: id,
    title,
    lifecycle_state: lifecycle as 'active' | 'scheduled' | 'completed' | 'expired' | 'draft' | 'paused' | 'archived',
    mission_type: missionType,
    test_type: missionType === 'concept_test' ? 'concept' : null,
    completed_claims: asNum(r.completed_claims),
    total_claims: asNum(r.total_claims),
    target_completions: r.target_completions == null ? null : asNum(r.target_completions),
  })
  const kind = asStr(r.kind)
  const badge =
    kind === 'stuck' ? 'Needs claims' : kind === 'results' ? 'Results ready' : 'Live'
  return {
    missionId: id,
    title,
    badge,
    detail: asStr(r.detail) || '',
    progress: null,
    href,
    ctaLabel,
  }
}

function buildHeroFromSnapshot(
  brandName: string,
  study: HomeStudyRow | null,
  narrative: { headline: string; sub: string } | null
): HomeHero {
  if (study) {
    return {
      kind: study.badge === 'Results ready' ? 'study_ready' : 'narrative',
      eyebrow: study.badge,
      headline: study.title,
      body: study.detail || 'Your research is live.',
      ctaLabel: study.ctaLabel,
      ctaHref: study.href,
    }
  }
  if (narrative?.headline) {
    return {
      kind: 'narrative',
      eyebrow: brandName,
      headline: narrative.headline,
      body: narrative.sub,
      ctaLabel: 'Open studies',
      ctaHref: '/studies',
    }
  }
  return {
    kind: 'empty',
    eyebrow: brandName,
    headline: 'Your brand command center',
    body: 'Claim products, open a study, or explore categories to build signal.',
    ctaLabel: 'Browse products',
    ctaHref: '/products',
  }
}

export function parseBrandHomeSnapshot(raw: unknown): BrandHomeSnapshotDoc | null {
  const root = asRecord(raw)
  if (!root) return null
  const chrome = parseBrandPortalChrome(root.chrome)
  if (!chrome) return null
  const brand = parseBrandStub(root.brand, chrome)
  if (!brand) return null

  const pulseRaw = asRecord(root.pulse) ?? {}
  const healthRaw = asRecord(root.catalog_health) ?? {}
  const studiesRaw = asRecord(root.studies) ?? {}

  const productCount = asNum(pulseRaw.product_count)
  const battledCount = asNum(pulseRaw.battled_count)
  const totalBattles = asNum(pulseRaw.total_battles)
  const openStudies = asNum(pulseRaw.open_studies)
  const gainingCount = asNum(pulseRaw.gaining_count)
  const categoryCount = asNum(pulseRaw.category_count)

  const catalogHealth: CatalogHealth = {
    total: asNum(healthRaw.total) || productCount,
    categories: metric(asRecord(healthRaw.categories)?.have, asRecord(healthRaw.categories)?.total ?? productCount),
    images: metric(asRecord(healthRaw.images)?.have, asRecord(healthRaw.images)?.total ?? productCount),
    pricing: metric(asRecord(healthRaw.pricing)?.have, asRecord(healthRaw.pricing)?.total ?? productCount),
    labelAllergen: metric(
      asRecord(healthRaw.label_allergen)?.have,
      asRecord(healthRaw.label_allergen)?.total ?? productCount
    ),
  }

  const signalCards = parseSignalCards(root.signal_cards)
  const categoriesTop = parseCategoriesTop(root.categories_top)
  const l2NodeIds = parseL2NodeIds(root.l2_node_ids)
  const studyHighlight = studyRowFromHighlight(studiesRaw.highlight)
  const studies = studyHighlight ? [studyHighlight] : []
  const intel = parseIntel(root.intel)
  const snapshot = intel ? intelToSnapshot(brand.brand_id, intel) : null
  const narrative = snapshot
    ? generateBrandHomeNarrative(snapshot, brand.brand_name, totalBattles)
    : {
        headline: `${brand.brand_name} is in the Dough database. Data builds as battles are recorded.`,
        sub: 'Catalog summary updates as products change',
      }

  const pulse: HomePulseItem[] = [
    {
      key: 'categories',
      label: 'Categories',
      value: String(categoryCount),
      detail: 'With your products',
    },
    {
      key: 'battled',
      label: 'Products with battles',
      value: String(battledCount),
      detail: 'Across your catalog',
    },
    {
      key: 'studies',
      label: 'Open studies',
      value: String(openStudies),
      detail: 'Live or scheduled',
    },
    {
      key: 'gaining',
      label: 'Gaining products',
      value: String(gainingCount),
      detail: 'Elo up over 30 days',
    },
  ]

  const homeModel: BrandHomeModel = {
    brandName: chrome.brandName,
    hero: buildHeroFromSnapshot(chrome.brandName, studyHighlight, narrative),
    pulse,
    categories: categoriesTop,
    products: [],
    studies,
    openStudiesCount: openStudies,
    productsWithBattles: battledCount,
  }

  return {
    generatedAt: asStr(root.generated_at) || new Date().toISOString(),
    catalogRefreshedAt: asStr(root.catalog_refreshed_at),
    catalogReady: root.catalog_ready === true,
    chrome,
    brand,
    intel,
    narrative,
    snapshot,
    pulse: {
      productCount,
      battledCount,
      totalBattles,
      openStudies,
      gainingCount,
      domainVerified: asBool(pulseRaw.domain_verified),
      categoryCount,
    },
    catalogHealth,
    signalCards,
    categoriesTop,
    l2NodeIds,
    homeModel,
    parentDisplayName: asStr(root.parent_display_name),
    pendingOwnership: asBool(root.pending_ownership),
  }
}

export function shadowDiffBrandHome(
  snap: BrandHomeSnapshotDoc,
  legacy: { productCount: number; openStudies: number; battled: number; gaining: number }
): string[] {
  const diffs: string[] = []
  if (snap.pulse.productCount !== legacy.productCount) {
    diffs.push(`product_count snap=${snap.pulse.productCount} legacy=${legacy.productCount}`)
  }
  if (snap.pulse.openStudies !== legacy.openStudies) {
    diffs.push(`open_studies snap=${snap.pulse.openStudies} legacy=${legacy.openStudies}`)
  }
  if (snap.pulse.battledCount !== legacy.battled) {
    diffs.push(`battled snap=${snap.pulse.battledCount} legacy=${legacy.battled}`)
  }
  if (snap.pulse.gainingCount !== legacy.gaining) {
    diffs.push(`gaining snap=${snap.pulse.gainingCount} legacy=${legacy.gaining}`)
  }
  return diffs
}
