import { describe, expect, it } from 'vitest'
import {
  isValidWorkEmail,
  parseBrandSearchHits,
  parseProductPreview,
} from '../brandApplicationFlow'

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

describe('parseProductPreview', () => {
  it('parses preview envelope', () => {
    const preview = parseProductPreview({
      brand_id: 9,
      total_count: 1570,
      with_image_count: 0,
      products: [
        { product_id: 1, name: 'York Peppermint', image_url: null },
        { product_id: 2, name: '', image_url: null },
      ],
    })
    expect(preview?.total_count).toBe(1570)
    expect(preview?.with_image_count).toBe(0)
    expect(preview?.products).toHaveLength(1)
  })
})

describe('isValidWorkEmail', () => {
  it('accepts normal emails and rejects junk', () => {
    expect(isValidWorkEmail('jane@brand.com')).toBe(true)
    expect(isValidWorkEmail('not-an-email')).toBe(false)
  })
})
