import { describe, expect, it } from 'vitest'
import {
  featuredLinkKeys,
  formatLocationLine,
  hiddenPopulatedLinkKeys,
  populatedLinkKeys,
} from '../brandHome/brandProfilePresence'
import type { SocialLinkKey } from '../brandHome/socialLinks'

function vals(partial: Partial<Record<SocialLinkKey, string>>): Record<SocialLinkKey, string> {
  return {
    brand_website_url: '',
    instagram_handle: '',
    tiktok_handle: '',
    youtube_handle: '',
    x_handle: '',
    linkedin_url: '',
    ...partial,
  }
}

describe('populatedLinkKeys', () => {
  it('ignores blanks and keeps website-first order', () => {
    expect(
      populatedLinkKeys(
        vals({
          instagram_handle: 'odwalla',
          brand_website_url: 'odwalla.com',
          tiktok_handle: '  ',
        })
      )
    ).toEqual(['brand_website_url', 'instagram_handle'])
  })
})

describe('featuredLinkKeys', () => {
  it('shows website plus the first populated social', () => {
    const populated = populatedLinkKeys(
      vals({
        brand_website_url: 'odwalla.com',
        instagram_handle: 'odwalladrinks',
        tiktok_handle: 'odwalla',
      })
    )
    expect(featuredLinkKeys(populated)).toEqual(['brand_website_url', 'instagram_handle'])
  })

  it('shows two socials when there is no website', () => {
    expect(featuredLinkKeys(['instagram_handle', 'tiktok_handle', 'x_handle'])).toEqual([
      'instagram_handle',
      'tiktok_handle',
    ])
  })

  it('returns empty when nothing is populated', () => {
    expect(featuredLinkKeys([])).toEqual([])
  })
})

describe('hiddenPopulatedLinkKeys', () => {
  it('counts remaining populated profiles only', () => {
    const populated = [
      'brand_website_url',
      'instagram_handle',
      'tiktok_handle',
    ] as SocialLinkKey[]
    const featured = featuredLinkKeys(populated)
    expect(hiddenPopulatedLinkKeys(populated, featured)).toEqual(['tiktok_handle'])
  })
})

describe('formatLocationLine', () => {
  it('joins stored city and state without inventing names', () => {
    expect(formatLocationLine('Santa Cruz', 'CA')).toBe('Santa Cruz, CA')
    expect(formatLocationLine('Santa Cruz', '')).toBe('Santa Cruz')
    expect(formatLocationLine('  ', '  ')).toBeNull()
  })
})
