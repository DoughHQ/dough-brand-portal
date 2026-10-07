import { describe, expect, it } from 'vitest'
import { buildHomeAttention } from '../homeAttention'
import type { BrandHomeModel } from '../selectHomeModel'
import type { CatalogHealth } from '../catalogHealth'

function model(partial: Partial<BrandHomeModel>): BrandHomeModel {
  return {
    brandName: 'Acme',
    hero: {
      kind: 'empty',
      eyebrow: '',
      headline: '',
      body: '',
      ctaLabel: '',
      ctaHref: '/',
    },
    pulse: [],
    categories: [],
    products: [],
    studies: [],
    openStudiesCount: 0,
    productsWithBattles: 0,
    ...partial,
  }
}

const gaps: CatalogHealth = {
  total: 10,
  images: { have: 5, total: 10 },
  pricing: { have: 10, total: 10 },
  categories: { have: 10, total: 10 },
  labelAllergen: { have: 10, total: 10 },
}

describe('buildHomeAttention', () => {
  it('surfaces results-ready study first', () => {
    const items = buildHomeAttention({
      model: model({
        openStudiesCount: 1,
        studies: [
          {
            missionId: 'm1',
            title: 'Garlic IHUT',
            badge: 'Results ready',
            detail: 'Done',
            progress: null,
            href: '/studies/box/m1/report',
            ctaLabel: 'View results',
          },
        ],
      }),
    })
    expect(items[0]?.kind).toBe('results')
    expect(items[0]?.title).toBe('Results ready')
  })

  it('adds catalog gaps', () => {
    const items = buildHomeAttention({
      model: model({}),
      catalogHealth: gaps,
    })
    expect(items.some((i) => i.kind === 'catalog')).toBe(true)
  })

  it('falls back to open studies count without highlight', () => {
    const items = buildHomeAttention({
      model: model({ openStudiesCount: 3 }),
    })
    expect(items[0]?.kind).toBe('open')
    expect(items[0]?.title).toContain('3 open')
  })
})
