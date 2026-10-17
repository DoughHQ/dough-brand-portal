import type { BrandCategoryL2 } from '@/lib/brandCategories'
import type { BrandSnapshot } from '@/lib/queries'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import { PRODUCT_NAME } from '@/lib/brand'
import { studyHref, type HomeHero, type HomeStudyInput } from './selectHomeModel'

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

export function buildHero(args: {
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
    body: `${args.brandName} is on ${PRODUCT_NAME}. Home fills in as shoppers compare your products and your studies come in.`,
    ctaLabel:
      args.categories.length > 0 ? 'Browse categories →' : 'Go to products →',
    ctaHref: args.categories.length > 0 ? '/categories' : '/products',
  }
}
