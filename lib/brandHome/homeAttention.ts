import type { CatalogHealth } from '@/lib/brandHome/catalogHealth'
import type { BrandHomeModel, HomeStudyRow } from '@/lib/brandHome/selectHomeModel'

export type HomeAttentionKind =
  | 'results'
  | 'stuck'
  | 'payment'
  | 'catalog'
  | 'open'

export type HomeAttentionItem = {
  id: string
  kind: HomeAttentionKind
  title: string
  body: string
  href: string
  ctaLabel: string
}

function catalogHasGaps(health: CatalogHealth | undefined): boolean {
  if (!health || health.total <= 0) return false
  return (
    health.images.have < health.images.total ||
    health.pricing.have < health.pricing.total ||
    health.categories.have < health.categories.total ||
    health.labelAllergen.have < health.labelAllergen.total
  )
}

function studyAttention(study: HomeStudyRow): HomeAttentionItem | null {
  const badge = study.badge.toLowerCase()
  if (badge.includes('results')) {
    return {
      id: `study-results-${study.missionId}`,
      kind: 'results',
      title: 'Results ready',
      body: study.title,
      href: study.href,
      ctaLabel: study.ctaLabel || 'Open report',
    }
  }
  if (badge.includes('payment') || badge.includes('awaiting')) {
    return {
      id: `study-pay-${study.missionId}`,
      kind: 'payment',
      title: 'Awaiting payment',
      body: study.title,
      href: study.href,
      ctaLabel: study.ctaLabel || 'Checkout',
    }
  }
  if (badge.includes('needs claims') || badge.includes('stuck')) {
    return {
      id: `study-stuck-${study.missionId}`,
      kind: 'stuck',
      title: 'Needs claims',
      body: study.detail || study.title,
      href: study.href,
      ctaLabel: study.ctaLabel || 'Open study',
    }
  }
  return null
}

/**
 * Typed “Needs attention” rows from the Home snapshot — no extra RPC.
 * Prefer study highlight signals, then catalog gaps, then generic open work.
 */
export function buildHomeAttention(args: {
  model: BrandHomeModel
  catalogHealth?: CatalogHealth
}): HomeAttentionItem[] {
  const { model, catalogHealth } = args
  const items: HomeAttentionItem[] = []
  const seen = new Set<string>()

  for (const study of model.studies) {
    const row = studyAttention(study)
    if (!row || seen.has(row.id)) continue
    seen.add(row.id)
    items.push(row)
  }

  if (catalogHasGaps(catalogHealth)) {
    items.push({
      id: 'catalog-gaps',
      kind: 'catalog',
      title: 'Catalog gaps',
      body: 'Missing images, pricing, or claims slow preference signal.',
      href: '/products',
      ctaLabel: 'Fix products',
    })
  }

  // If we only have open studies count and no highlight-derived row, surface open work.
  if (
    items.length === 0 &&
    model.openStudiesCount > 0 &&
    model.studies.length === 0
  ) {
    items.push({
      id: 'open-studies',
      kind: 'open',
      title: `${model.openStudiesCount} open stud${model.openStudiesCount === 1 ? 'y' : 'ies'}`,
      body: 'Pick up live research or launch the next test.',
      href: '/studies',
      ctaLabel: 'Open studies',
    })
  } else if (
    items.every((i) => i.kind === 'catalog') &&
    model.openStudiesCount > 0 &&
    !model.studies.some((s) => studyAttention(s))
  ) {
    items.unshift({
      id: 'open-studies',
      kind: 'open',
      title: `${model.openStudiesCount} open stud${model.openStudiesCount === 1 ? 'y' : 'ies'}`,
      body: 'Live or scheduled research waiting on you.',
      href: '/studies',
      ctaLabel: 'Open studies',
    })
  }

  return items
}
