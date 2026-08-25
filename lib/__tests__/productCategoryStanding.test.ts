import { describe, expect, it } from 'vitest'
import {
  formatOrdinal,
  formatStandingRank,
  insufficientReasonLabel,
  ordinalSuffix,
  parseBrandProductCategoryStanding,
} from '../brandHome/productCategoryStanding'

describe('ordinalSuffix', () => {
  it('uses st/nd/rd/th correctly', () => {
    expect(ordinalSuffix(1)).toBe('st')
    expect(ordinalSuffix(2)).toBe('nd')
    expect(ordinalSuffix(3)).toBe('rd')
    expect(ordinalSuffix(4)).toBe('th')
    expect(ordinalSuffix(11)).toBe('th')
    expect(ordinalSuffix(12)).toBe('th')
    expect(ordinalSuffix(13)).toBe('th')
    expect(ordinalSuffix(21)).toBe('st')
    expect(ordinalSuffix(22)).toBe('nd')
    expect(ordinalSuffix(23)).toBe('rd')
    expect(ordinalSuffix(1041)).toBe('st')
  })
})

describe('formatOrdinal / formatStandingRank', () => {
  it('formats rank with real pool size', () => {
    expect(formatOrdinal(4)).toBe('4th')
    expect(formatStandingRank(4, 40)).toBe('4th of 40')
    expect(formatStandingRank(1, 12)).toBe('1st of 12')
  })

  it('never invents an ordinal without both integers', () => {
    expect(formatStandingRank(null, 40)).toBeNull()
    expect(formatStandingRank(4, null)).toBeNull()
    expect(formatStandingRank(undefined, undefined)).toBeNull()
    expect(formatStandingRank(4, 0)).toBeNull()
    expect(formatStandingRank(Number.NaN, 40)).toBeNull()
  })
})

describe('parseBrandProductCategoryStanding', () => {
  it('returns honest empty for null / garbage', () => {
    expect(parseBrandProductCategoryStanding(null)).toMatchObject({
      has_any_standing: false,
      headline: null,
      products: [],
    })
    expect(parseBrandProductCategoryStanding('nope').has_any_standing).toBe(false)
  })

  it('keeps empty primary when has_any_standing is false even with products', () => {
    const parsed = parseBrandProductCategoryStanding({
      brand_id: 20001345,
      has_any_standing: false,
      headline: null,
      products: [
        {
          product_id: 1,
          product_name: 'Odwalla Original',
          taxonomy_node_id: 9,
          has_standing: false,
          insufficient_reason: 'no_score',
          taste_elo_score: null,
          battles: 0,
          rank_in_pool: null,
          pool_size: null,
          stderr: null,
          confidence: null,
        },
      ],
      min_battles_floor: 10,
    })
    expect(parsed.has_any_standing).toBe(false)
    expect(parsed.headline).toBeNull()
    expect(parsed.products).toHaveLength(1)
    expect(parsed.products[0].rank_in_pool).toBeNull()
    expect(insufficientReasonLabel(parsed.products[0].insufficient_reason)).toBe(
      'not enough comparisons yet'
    )
  })

  it('does not trust has_any_standing without a qualifying product', () => {
    const parsed = parseBrandProductCategoryStanding({
      brand_id: 1,
      has_any_standing: true,
      headline: { product_id: 1, product_name: 'X', has_standing: false },
      products: [{ product_id: 1, product_name: 'X', has_standing: false }],
      min_battles_floor: 10,
    })
    expect(parsed.has_any_standing).toBe(false)
    expect(parsed.headline).toBeNull()
  })

  it('parses a qualifying product standing', () => {
    const parsed = parseBrandProductCategoryStanding({
      brand_id: 20001345,
      has_any_standing: true,
      headline: {
        product_id: 123,
        product_name: 'Odwalla Original',
        taxonomy_node_id: 9330029,
        has_standing: true,
        insufficient_reason: null,
        taste_elo_score: 1120,
        battles: 42,
        rank_in_pool: 4,
        pool_size: 40,
        stderr: 0.12,
        confidence: 'MEDIUM',
      },
      products: [
        {
          product_id: 123,
          product_name: 'Odwalla Original',
          taxonomy_node_id: 9330029,
          has_standing: true,
          insufficient_reason: null,
          taste_elo_score: 1120,
          battles: 42,
          rank_in_pool: 4,
          pool_size: 40,
          stderr: 0.12,
          confidence: 'MEDIUM',
        },
        {
          product_id: 124,
          product_name: 'Odwalla Citrus',
          has_standing: false,
          insufficient_reason: 'too_few_battles',
          battles: 2,
          rank_in_pool: null,
          pool_size: null,
        },
      ],
      min_battles_floor: 10,
    })
    expect(parsed.has_any_standing).toBe(true)
    expect(parsed.headline?.product_name).toBe('Odwalla Original')
    expect(formatStandingRank(parsed.headline!.rank_in_pool, parsed.headline!.pool_size)).toBe(
      '4th of 40'
    )
    expect(parsed.products[0].confidence).toBe('MEDIUM')
    expect(parsed.products[1].has_standing).toBe(false)
    expect(parsed.products[1].rank_in_pool).toBeNull()
  })

  it('strips fabricated ranks from non-standing products', () => {
    const parsed = parseBrandProductCategoryStanding({
      brand_id: 1,
      has_any_standing: false,
      headline: null,
      products: [
        {
          product_id: 9,
          product_name: 'Broken',
          has_standing: false,
          rank_in_pool: 1041,
          pool_size: 1,
          taste_elo_score: 999,
          confidence: 'HIGH',
        },
      ],
    })
    expect(parsed.products[0].rank_in_pool).toBeNull()
    expect(parsed.products[0].pool_size).toBeNull()
    expect(parsed.products[0].taste_elo_score).toBeNull()
    expect(parsed.products[0].confidence).toBeNull()
  })
})
