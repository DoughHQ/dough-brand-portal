import { describe, expect, it } from 'vitest'
import {
  isValidBrandWebsite,
  isValidWorkEmail,
  parseBrandSearchHits,
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

describe('isValidWorkEmail', () => {
  it('accepts normal emails and rejects junk', () => {
    expect(isValidWorkEmail('jane@brand.com')).toBe(true)
    expect(isValidWorkEmail('not-an-email')).toBe(false)
  })
})

describe('isValidBrandWebsite', () => {
  it('matches the brand_waitlist_website_shape truth table', () => {
    expect(isValidBrandWebsite('')).toBe(true)
    expect(isValidBrandWebsite('   ')).toBe(true)
    expect(isValidBrandWebsite('drinkwinstreak.com')).toBe(true)
    expect(isValidBrandWebsite('https://www.drinkwinstreak.com/about?x=1')).toBe(true)
    expect(isValidBrandWebsite('http://shop.brand.co.uk')).toBe(true)
    expect(isValidBrandWebsite('brand.com:8080/path')).toBe(true)

    expect(isValidBrandWebsite('javascript:alert(1)')).toBe(false)
    expect(isValidBrandWebsite('not a site')).toBe(false)
    expect(isValidBrandWebsite('brand')).toBe(false)
    expect(isValidBrandWebsite('https://')).toBe(false)
    expect(isValidBrandWebsite('ftp://brand.com')).toBe(false)
    expect(isValidBrandWebsite('brand..com')).toBe(false)
    expect(isValidBrandWebsite('-brand.com')).toBe(false)
    expect(isValidBrandWebsite(`${'a'.repeat(297)}.com`)).toBe(false)
  })
})
