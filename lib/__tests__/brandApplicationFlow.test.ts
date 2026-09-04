import { describe, expect, it } from 'vitest'
import { isValidWorkEmail, parseBrandSearchHits } from '../brandApplicationFlow'

describe('parseBrandSearchHits', () => {
  it('parses a jsonb array of brand hits', () => {
    const hits = parseBrandSearchHits([
      {
        brand_id: 9,
        brand_name: 'The Hershey Company',
        product_count: 1570,
        sample_products: ["Reese's Cups", 'Twizzlers Twists', 'York Peppermint'],
      },
      { brand_id: 'bad' },
    ])
    expect(hits).toHaveLength(1)
    expect(hits[0].brand_id).toBe(9)
    expect(hits[0].sample_products).toHaveLength(3)
  })

  it('returns empty for non-arrays', () => {
    expect(parseBrandSearchHits({ brands: [] })).toEqual([])
    expect(parseBrandSearchHits(null)).toEqual([])
  })
})

describe('isValidWorkEmail', () => {
  it('accepts normal emails and rejects junk', () => {
    expect(isValidWorkEmail('jane@brand.com')).toBe(true)
    expect(isValidWorkEmail('not-an-email')).toBe(false)
  })
})
