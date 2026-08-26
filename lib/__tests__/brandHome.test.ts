import { describe, expect, it } from 'vitest'
import {
  productChipFromVelocity,
  selectHomeModel,
  studyHref,
  type HomeStudyInput,
} from '../brandHome/selectHomeModel'
import type { BrandCategoryL2 } from '../brandCategories'
import type { BrandSnapshot, ProductIntelligence } from '../queries'

function cat(partial: Partial<BrandCategoryL2> & Pick<BrandCategoryL2, 'l2NodeId' | 'l2Name'>): BrandCategoryL2 {
  return {
    productCount: 1,
    battles: 0,
    productsWithBattles: 0,
    ...partial,
  }
}

function study(partial: Partial<HomeStudyInput> & Pick<HomeStudyInput, 'mission_id' | 'lifecycle_state'>): HomeStudyInput {
  return {
    title: 'Test study',
    test_type: 'concept',
    mission_type: 'concept_test',
    completed_claims: 0,
    total_claims: 0,
    target_completions: null,
    ...partial,
  }
}

function intel(partial: Partial<ProductIntelligence> & Pick<ProductIntelligence, 'product_id'>): ProductIntelligence {
  return {
    product_intel_id: 1,
    brand_id: 1,
    global_elo_score: 1000,
    elo_percentile: null,
    taxonomy_node_name: 'Salty Snacks',
    elo_velocity_30d: null,
    total_battles_all_time: 0,
    total_battles_30d: 0,
    win_rate_30d: null,
    occasion_affinity: [],
    audience_profile: { strongest_cohort: null, cohort_win_rate: null, gender_skew: null },
    competitive_narrative: {} as ProductIntelligence['competitive_narrative'],
    ...partial,
  }
}

describe('productChipFromVelocity', () => {
  it('maps building / gaining / declining / stable', () => {
    expect(productChipFromVelocity(10, 0)).toBe('building')
    expect(productChipFromVelocity(10, 5)).toBe('gaining')
    expect(productChipFromVelocity(-10, 5)).toBe('declining')
    expect(productChipFromVelocity(2, 5)).toBe('stable')
  })
})

describe('studyHref', () => {
  it('routes completed concept studies to report', () => {
    expect(studyHref(study({ mission_id: 'abc', lifecycle_state: 'completed' })).href).toBe(
      '/studies/concept/abc/report'
    )
  })
})

describe('selectHomeModel', () => {
  const baseNarrative = { headline: 'Acme is gaining ground.', sub: 'Updated daily' }

  it('prefers study results for hero over narrative', () => {
    const model = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: { total_battles_all_time: 100, elo_velocity_30d: 20 } as BrandSnapshot,
      categories: [cat({ l2NodeId: 1, l2Name: 'Snacks', battles: 10 })],
      studies: [study({ mission_id: 'm1', title: 'Pack test', lifecycle_state: 'completed' })],
      productIntelligence: [],
      productNames: [],
    })
    expect(model.hero.kind).toBe('study_ready')
    expect(model.hero.headline).toContain('Pack test')
    expect(model.hero.ctaHref).toContain('/report')
  })

  it('uses narrative when momentum exists and no study ready', () => {
    const model = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: { total_battles_all_time: 100, elo_velocity_30d: 12 } as BrandSnapshot,
      categories: [],
      studies: [],
      productIntelligence: [],
      productNames: [],
    })
    expect(model.hero.kind).toBe('narrative')
    expect(model.hero.headline).toBe(baseNarrative.headline)
  })

  it('uses the ledger battle total in getting-started hero copy, not the snapshot', () => {
    const model = selectHomeModel({
      brandName: 'Odwalla, Inc.',
      narrative: {
        headline: 'Odwalla, Inc. is getting started on Dough. Early data is coming in.',
        sub: '48 battles counted so far · Data updates daily',
      },
      snapshot: { total_battles_all_time: 48, elo_velocity_30d: 0 } as BrandSnapshot,
      categories: [],
      studies: [],
      productIntelligence: [],
      productNames: [],
      totalBattles: 57,
    })
    expect(model.hero.kind).toBe('narrative')
    expect(model.hero.body).toBe('57 battles counted so far · Data updates daily')
    expect(model.hero.body).not.toContain('48')
  })

  it('falls back to category then empty', () => {
    const withCat = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: null,
      categories: [cat({ l2NodeId: 9, l2Name: 'Alcohol', battles: 4 })],
      studies: [],
      productIntelligence: [],
      productNames: [],
    })
    expect(withCat.hero.kind).toBe('category')
    expect(withCat.hero.ctaHref).toBe('/reports')

    const unlockedCat = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: null,
      categories: [cat({ l2NodeId: 9, l2Name: 'Alcohol', battles: 4 })],
      studies: [],
      productIntelligence: [],
      productNames: [],
      unlockedL2Ids: [9],
    })
    expect(unlockedCat.hero.ctaHref).toBe('/categories/9')

    const empty = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: null,
      categories: [],
      studies: [],
      productIntelligence: [],
      productNames: [],
    })
    expect(empty.hero.kind).toBe('empty')
    expect(empty.hero.ctaHref).toBe('/products')
  })

  it('picks categories and products by signal', () => {
    const model = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: null,
      categories: [
        cat({ l2NodeId: 1, l2Name: 'A', battles: 1 }),
        cat({ l2NodeId: 2, l2Name: 'B', battles: 50 }),
      ],
      studies: [study({ mission_id: 'x', lifecycle_state: 'active', completed_claims: 10, target_completions: 20 })],
      productIntelligence: [
        intel({ product_id: 1, elo_velocity_30d: 1, total_battles_all_time: 100 }),
        intel({ product_id: 2, elo_velocity_30d: 20, total_battles_all_time: 10 }),
      ],
      productNames: [
        { product_id: 1, product_name_display: 'Slow', total_battles: 100 },
        { product_id: 2, product_name_display: 'Fast', total_battles: 10 },
      ],
    })
    expect(model.categories[0]?.name).toBe('B')
    expect(model.categories[0]?.unlocked).toBe(false)
    expect(model.categories[0]?.href).toBe('/reports')
    expect(model.categories[0]?.ctaLabel).toContain('Unlock')
    expect(model.categories[0]?.bannerImageUrl).toBeNull()
    expect(model.products[0]?.name).toBe('Fast')
    expect(model.products[0]?.chip).toBe('gaining')
    expect(model.studies[0]?.badge).toBe('Live')
    expect(model.studies[0]?.progress).toBe(50)
  })

  it('unlocks purchased categories and surfaces honest rank labels', () => {
    const model = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: null,
      categories: [cat({ l2NodeId: 2, l2Name: 'B', battles: 50 })],
      studies: [],
      productIntelligence: [
        intel({ product_id: 2, elo_velocity_30d: 20, total_battles_all_time: 10, elo_percentile: 0.12 }),
      ],
      productNames: [{ product_id: 2, product_name_display: 'Fast', total_battles: 10 }],
      unlockedL2Ids: [2],
    })
    expect(model.categories[0]?.unlocked).toBe(true)
    expect(model.categories[0]?.href).toBe('/categories/2')
    expect(model.categories[0]?.ctaLabel).toContain('Overview')
    expect(model.products[0]?.rankLabel).toBe('Top 12% in category')
  })

  it('passes through existing category banner urls', () => {
    const model = selectHomeModel({
      brandName: 'Acme',
      narrative: baseNarrative,
      snapshot: null,
      categories: [
        cat({
          l2NodeId: 2,
          l2Name: 'Juices',
          battles: 50,
          bannerImageUrl: 'https://cdn.example/juices.jpg',
        }),
      ],
      studies: [],
      productIntelligence: [],
      productNames: [],
    })
    expect(model.categories[0]?.bannerImageUrl).toBe('https://cdn.example/juices.jpg')
  })
})
