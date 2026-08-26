import type { BrandCategoryL2 } from '@/lib/brandCategories'
import type { BrandSnapshot, ProductIntelligence } from '@/lib/queries'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import type { OperatorStudyRow } from '@/lib/studies/types'

export type HomeHeroKind = 'study_ready' | 'narrative' | 'category' | 'empty'

export type HomeHero = {
  kind: HomeHeroKind
  eyebrow: string
  headline: string
  body: string
  ctaLabel: string
  ctaHref: string
}

export type HomePulseItem = {
  key: string
  label: string
  value: string
  detail: string
}

export type HomeCategoryCard = {
  l2NodeId: number
  name: string
  status: 'building' | 'active'
  detail: string
  href: string
  /** False when brand has not purchased this category report. */
  unlocked: boolean
  ctaLabel: string
  bannerImageUrl: string | null
}

export type HomeProductChip = 'gaining' | 'stable' | 'building' | 'declining'

export type HomeProductRow = {
  productId: number
  name: string
  category: string | null
  chip: HomeProductChip
  insight: string
  /** Honest standing when available — never invents #N of M. */
  rankLabel: string | null
  href: string
}

export type HomeStudyRow = {
  missionId: string
  title: string
  badge: string
  detail: string
  progress: number | null
  href: string
  ctaLabel: string
}

export type BrandHomeModel = {
  brandName: string
  hero: HomeHero
  pulse: HomePulseItem[]
  categories: HomeCategoryCard[]
  products: HomeProductRow[]
  studies: HomeStudyRow[]
  openStudiesCount: number
  productsWithBattles: number
}

export type HomeStudyInput = Pick<
  OperatorStudyRow,
  | 'mission_id'
  | 'title'
  | 'lifecycle_state'
  | 'test_type'
  | 'mission_type'
  | 'completed_claims'
  | 'total_claims'
  | 'target_completions'
>

export type HomeProductName = {
  product_id: number
  product_name_display: string
  total_battles?: number
}

/** Chip from velocity — thresholds are display heuristics, not statistical claims. */
export function productChipFromVelocity(
  velocity: number | null,
  battles: number
): HomeProductChip {
  if (battles <= 0) return 'building'
  if (velocity == null) return 'stable'
  if (velocity > 5) return 'gaining'
  if (velocity < -5) return 'declining'
  return 'stable'
}

export function productInsight(
  chip: HomeProductChip,
  velocity: number | null,
  battles: number
): string {
  if (chip === 'building') return 'Waiting on consumer battles in-category.'
  if (chip === 'gaining' && velocity != null) {
    return `Preference strength up ~${Math.round(velocity)} Elo over 30 days.`
  }
  if (chip === 'declining' && velocity != null) {
    return `Preference strength down ~${Math.abs(Math.round(velocity))} Elo over 30 days.`
  }
  if (battles > 0) return `${battles.toLocaleString()} battles counted · holding steady.`
  return 'Early signal — keep battling in this category.'
}

export function studyHref(row: HomeStudyInput): { href: string; ctaLabel: string } {
  const isConcept =
    row.test_type === 'concept' || row.mission_type === 'concept_test'
  if (
    row.lifecycle_state === 'completed' ||
    row.lifecycle_state === 'expired' ||
    row.lifecycle_state === 'archived'
  ) {
    return {
      href: isConcept
        ? `/studies/concept/${row.mission_id}/report`
        : `/reports/${row.mission_id}`,
      ctaLabel: 'View results',
    }
  }
  if (row.lifecycle_state === 'draft') {
    return {
      href: isConcept ? `/studies/concept/new` : `/studies`,
      ctaLabel: 'Continue draft',
    }
  }
  return {
    href: isConcept
      ? `/studies/concept/${row.mission_id}`
      : `/studies`,
    ctaLabel: 'Open study',
  }
}

export function studyBadge(state: HomeStudyInput['lifecycle_state']): string {
  if (state === 'completed') return 'Results ready'
  if (state === 'draft') return 'Draft'
  if (state === 'scheduled') return 'Scheduled'
  if (state === 'paused') return 'Paused'
  if (state === 'expired') return 'Expired'
  if (state === 'archived') return 'Archived'
  return 'Live'
}

export function studyProgress(row: HomeStudyInput): {
  detail: string
  progress: number | null
} {
  const target = row.target_completions
  const done = row.completed_claims
  if (target != null && target > 0) {
    const pct = Math.min(100, Math.round((done / target) * 100))
    return {
      detail: `${done.toLocaleString()} / ${target.toLocaleString()} completions`,
      progress: pct,
    }
  }
  if (done > 0) {
    return { detail: `${done.toLocaleString()} completions`, progress: null }
  }
  return { detail: 'In progress', progress: null }
}

function pickStudies(studies: HomeStudyInput[]): HomeStudyRow[] {
  const score = (s: HomeStudyInput) => {
    if (s.lifecycle_state === 'completed') return 0
    if (s.lifecycle_state === 'active' || s.lifecycle_state === 'scheduled') return 1
    if (s.lifecycle_state === 'draft') return 2
    return 3
  }
  return [...studies]
    .sort((a, b) => score(a) - score(b))
    .slice(0, 3)
    .map((s) => {
      const { href, ctaLabel } = studyHref(s)
      const { detail, progress } = studyProgress(s)
      return {
        missionId: s.mission_id,
        title: s.title || 'Untitled study',
        badge: studyBadge(s.lifecycle_state),
        detail,
        progress,
        href,
        ctaLabel,
      }
    })
}

function rankLabelFromIntel(p: ProductIntelligence): string | null {
  if (p.elo_percentile != null && Number.isFinite(p.elo_percentile)) {
    const pct = p.elo_percentile <= 1 ? Math.round(p.elo_percentile * 100) : Math.round(p.elo_percentile)
    if (pct >= 1 && pct <= 100) return `Top ${pct}% in category`
  }
  if (p.global_elo_score != null && Number.isFinite(p.global_elo_score)) {
    return `Elo ${Math.round(p.global_elo_score)}`
  }
  return null
}

function pickCategories(
  categories: BrandCategoryL2[],
  unlockedL2Ids: Set<number>
): HomeCategoryCard[] {
  return [...categories]
    .sort((a, b) => b.battles - a.battles || a.l2Name.localeCompare(b.l2Name))
    .slice(0, 4)
    .map((c) => {
      const unlocked = unlockedL2Ids.has(c.l2NodeId)
      return {
        l2NodeId: c.l2NodeId,
        name: c.l2Name,
        status: c.battles > 0 ? ('active' as const) : ('building' as const),
        detail:
          c.battles > 0
            ? `${c.productsWithBattles} of ${c.productCount} products with battles · ${c.battles.toLocaleString()} battles`
            : `${c.productCount} product${c.productCount === 1 ? '' : 's'} · building signal`,
        href: unlocked ? brandCategoryOverviewHref(c.l2NodeId) : '/reports',
        unlocked,
        ctaLabel: unlocked ? 'Open Overview →' : 'Unlock in Reports →',
        bannerImageUrl: c.bannerImageUrl?.trim() || null,
      }
    })
}

function pickProducts(
  intel: ProductIntelligence[],
  names: HomeProductName[]
): HomeProductRow[] {
  const nameById = new Map(names.map((p) => [p.product_id, p]))
  const scored = intel.map((p) => {
    const meta = nameById.get(p.product_id)
    const battles = p.total_battles_all_time || meta?.total_battles || 0
    const vel = p.elo_velocity_30d
    const absVel = vel == null ? 0 : Math.abs(vel)
    return { p, meta, battles, vel, absVel }
  })
  scored.sort((a, b) => {
    if (b.absVel !== a.absVel) return b.absVel - a.absVel
    return b.battles - a.battles
  })
  return scored.slice(0, 5).map(({ p, meta, battles, vel }) => {
    const chip = productChipFromVelocity(vel, battles)
    return {
      productId: p.product_id,
      name: meta?.product_name_display ?? `Product ${p.product_id}`,
      category: p.taxonomy_node_name,
      chip,
      insight: productInsight(chip, vel, battles),
      rankLabel: rankLabelFromIntel(p),
      href: '/products',
    }
  })
}

function battlesCountedSoFarBody(totalBattles: number): string {
  return `${totalBattles.toLocaleString()} battles counted so far · Data updates daily`
}

function narrativeBodyWithLedger(
  sub: string,
  totalBattles: number | undefined
): string {
  if (totalBattles == null || !sub.includes('battles counted so far')) return sub
  return battlesCountedSoFarBody(totalBattles)
}

function buildHero(args: {
  brandName: string
  narrative: { headline: string; sub: string }
  snapshot: BrandSnapshot | null
  studies: HomeStudyInput[]
  categories: BrandCategoryL2[]
  unlockedL2Ids: Set<number>
  totalBattles?: number
}): HomeHero {
  const ready = args.studies.find((s) => s.lifecycle_state === 'completed')
  if (ready) {
    const { href } = studyHref(ready)
    return {
      kind: 'study_ready',
      eyebrow: 'Your strongest signal',
      headline: `${ready.title || 'A study'} has results ready.`,
      body: 'Review what consumers preferred — then decide what to ship or test next.',
      ctaLabel: 'View results →',
      ctaHref: href,
    }
  }

  const hasMomentum =
    args.snapshot != null &&
    ((args.snapshot.total_battles_all_time ?? 0) >= 20 ||
      (args.snapshot.elo_velocity_30d != null &&
        Math.abs(args.snapshot.elo_velocity_30d) > 5))

  if (hasMomentum) {
    return {
      kind: 'narrative',
      eyebrow: 'Your strongest signal',
      headline: args.narrative.headline,
      body: narrativeBodyWithLedger(args.narrative.sub, args.totalBattles),
      ctaLabel: 'Browse categories →',
      ctaHref: '/categories',
    }
  }

  const topCat = [...args.categories].sort((a, b) => b.battles - a.battles)[0]
  if (topCat && topCat.battles > 0) {
    const unlocked = args.unlockedL2Ids.has(topCat.l2NodeId)
    return {
      kind: 'category',
      eyebrow: 'Your strongest signal',
      headline: `${topCat.l2Name} has the most battle activity in your portfolio.`,
      body: unlocked
        ? 'Open the category Overview to see preference ranking — or a refusal if too few distinct people have battled.'
        : 'Unlock this category in Reports to open the full Overview.',
      ctaLabel: unlocked ? `See ${topCat.l2Name} →` : 'Unlock in Reports →',
      ctaHref: unlocked ? brandCategoryOverviewHref(topCat.l2NodeId) : '/reports',
    }
  }

  return {
    kind: 'empty',
    eyebrow: 'Your strongest signal',
    headline: 'No major changes yet',
    body: `${args.brandName} is on Dough. Claim products and grow organic category battles — Home will surface what matters as signal arrives.`,
    ctaLabel:
      args.categories.length > 0 ? 'Browse categories →' : 'Go to products →',
    ctaHref: args.categories.length > 0 ? '/categories' : '/products',
  }
}

export function selectHomeModel(input: {
  brandName: string
  narrative: { headline: string; sub: string }
  snapshot: BrandSnapshot | null
  categories: BrandCategoryL2[]
  studies: HomeStudyInput[]
  productIntelligence: ProductIntelligence[]
  productNames: HomeProductName[]
  /** L2 taxonomy node ids the brand has unlocked (report purchase or admin). */
  unlockedL2Ids?: number[]
  /** get_brand_total_battles.total_battles — same integer as the profile tile. */
  totalBattles?: number
}): BrandHomeModel {
  const unlocked = new Set(input.unlockedL2Ids ?? [])
  // Prefer category rollup (launcher) over scanning product names — Home no longer loads the full catalog.
  const productsWithBattles =
    input.categories.length > 0
      ? input.categories.reduce((s, c) => s + (c.productsWithBattles || 0), 0)
      : input.productNames.filter((p) => (p.total_battles ?? 0) > 0).length
  const openStudiesCount = input.studies.filter(
    (s) => s.lifecycle_state === 'active' || s.lifecycle_state === 'scheduled'
  ).length
  const gaining = input.productIntelligence.filter(
    (p) => (p.elo_velocity_30d ?? 0) > 5
  ).length

  const pulse: HomePulseItem[] = [
    {
      key: 'categories',
      label: 'Categories',
      value: String(input.categories.length),
      detail: 'With your products',
    },
    {
      key: 'battled',
      label: 'Products with battles',
      value: String(productsWithBattles),
      detail: 'Across your catalog',
    },
    {
      key: 'studies',
      label: 'Open studies',
      value: String(openStudiesCount),
      detail: 'Live or scheduled',
    },
    {
      key: 'gaining',
      label: 'Gaining products',
      value: String(gaining),
      detail: 'Elo up over 30 days',
    },
  ]

  return {
    brandName: input.brandName,
    hero: buildHero({
      brandName: input.brandName,
      narrative: input.narrative,
      snapshot: input.snapshot,
      studies: input.studies,
      categories: input.categories,
      unlockedL2Ids: unlocked,
      totalBattles: input.totalBattles,
    }),
    pulse,
    categories: pickCategories(input.categories, unlocked),
    products: pickProducts(input.productIntelligence, input.productNames),
    studies: pickStudies(input.studies),
    openStudiesCount,
    productsWithBattles,
  }
}
