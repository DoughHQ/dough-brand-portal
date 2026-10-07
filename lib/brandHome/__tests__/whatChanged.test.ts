import { describe, expect, it } from 'vitest'
import {
  captureHomeBaseline,
  diffWhatChanged,
  type HomeBaseline,
} from '../whatChanged'
import type { BrandHomeModel } from '../selectHomeModel'

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
    pulse: [{ key: 'gaining', label: 'Gaining', value: '2', detail: '' }],
    categories: [
      {
        l2NodeId: 10,
        name: 'Snacks',
        status: 'active',
        detail: '',
        href: '/categories/10',
        unlocked: true,
        ctaLabel: 'Open',
        bannerImageUrl: null,
      },
    ],
    products: [],
    studies: [],
    openStudiesCount: 1,
    productsWithBattles: 4,
    ...partial,
  }
}

describe('diffWhatChanged', () => {
  it('returns empty on first visit', () => {
    const m = model({})
    const next = captureHomeBaseline(m)
    expect(diffWhatChanged(null, next, m)).toEqual([])
  })

  it('flags new results and unlocked categories', () => {
    const prev: HomeBaseline = {
      openStudiesCount: 1,
      productsWithBattles: 4,
      gainingCount: 2,
      unlockedL2Ids: [],
      studyMissionId: 'm1',
      studyBadge: 'Live',
      seenAt: 1,
    }
    const m = model({
      studies: [
        {
          missionId: 'm1',
          title: 'Garlic',
          badge: 'Results ready',
          detail: '',
          progress: null,
          href: '/r',
          ctaLabel: 'View',
        },
      ],
    })
    const next = captureHomeBaseline(m)
    const items = diffWhatChanged(prev, next, m)
    expect(items.map((i) => i.id)).toContain('results-ready')
    expect(items.map((i) => i.id)).toContain('unlock-10')
  })

  it('reports open study deltas', () => {
    const prev: HomeBaseline = {
      openStudiesCount: 1,
      productsWithBattles: 4,
      gainingCount: 0,
      unlockedL2Ids: [10],
      studyMissionId: null,
      studyBadge: null,
      seenAt: 1,
    }
    const m = model({ openStudiesCount: 3, pulse: [] })
    const next = captureHomeBaseline(m)
    const items = diffWhatChanged(prev, next, m)
    expect(items.find((i) => i.id === 'open-delta')?.label).toBe('+2 open studies')
  })
})
