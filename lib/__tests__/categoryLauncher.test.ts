import { describe, expect, it } from 'vitest'
import {
  formatCompeteCounts,
  parseBrandCategoryLauncher,
} from '../categoryLauncher'

describe('formatCompeteCounts', () => {
  it('keeps products-with-battles visible', () => {
    expect(
      formatCompeteCounts({
        l2_id: 1,
        l2_name: 'Milk',
        l1_name: 'Dairy',
        banner_image_url: null,
        icon_name: null,
        total_products: 30,
        products_with_battles: 1,
        total_battles: 79,
        entitled: false,
      })
    ).toBe('30 products · 1 with battles · 79 battles')
  })
})

describe('parseBrandCategoryLauncher', () => {
  it('returns empty buckets for null', () => {
    expect(parseBrandCategoryLauncher(null)).toEqual({
      owned: [],
      has_products: [],
      browse: [],
      search: null,
    })
  })

  it('parses three tiers and keeps entitled false honest', () => {
    const parsed = parseBrandCategoryLauncher({
      owned: [],
      has_products: [
        {
          l2_id: 10,
          l2_name: 'Juices',
          l1_name: 'Beverages',
          banner_image_url: 'https://example.com/b.jpg',
          icon_name: 'juice',
          total_products: 7,
          products_with_battles: 2,
          total_battles: 40,
          entitled: false,
        },
      ],
      browse: [
        {
          l2_id: 20,
          l2_name: 'Milk',
          l1_name: 'Dairy',
          total_products: 0,
          products_with_battles: 0,
          total_battles: 0,
          entitled: false,
        },
      ],
      search: 'milk',
    })
    expect(parsed.owned).toHaveLength(0)
    expect(parsed.has_products[0]?.l2_name).toBe('Juices')
    expect(parsed.has_products[0]?.entitled).toBe(false)
    expect(parsed.browse[0]?.l2_name).toBe('Milk')
    expect(parsed.search).toBe('milk')
  })

  it('dedupes so owned wins over has_products and browse', () => {
    const parsed = parseBrandCategoryLauncher({
      owned: [{ l2_id: 1, l2_name: 'A', entitled: true, total_products: 1 }],
      has_products: [
        { l2_id: 1, l2_name: 'A-dup', entitled: false, total_products: 9 },
        { l2_id: 2, l2_name: 'B', entitled: false, total_products: 3 },
      ],
      browse: [
        { l2_id: 1, l2_name: 'A-browse', entitled: false },
        { l2_id: 2, l2_name: 'B-browse', entitled: false },
        { l2_id: 3, l2_name: 'C', entitled: false },
      ],
      search: null,
    })
    expect(parsed.owned.map((c) => c.l2_id)).toEqual([1])
    expect(parsed.has_products.map((c) => c.l2_id)).toEqual([2])
    expect(parsed.browse.map((c) => c.l2_id)).toEqual([3])
  })
})
