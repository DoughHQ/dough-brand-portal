import { describe, expect, it } from 'vitest'
import {
  bareHandle,
  displaySocialValue,
  displayWebsite,
  ensureAbsoluteHttpUrl,
  socialOutboundUrl,
} from '../brandHome/socialLinks'

describe('bareHandle', () => {
  it('strips @ for edit/store', () => {
    expect(bareHandle('@odwalla')).toBe('odwalla')
    expect(bareHandle('odwalla')).toBe('odwalla')
  })
})

describe('ensureAbsoluteHttpUrl', () => {
  it('prefixes https when scheme is missing', () => {
    expect(ensureAbsoluteHttpUrl('odwalla.com')).toBe('https://odwalla.com')
    expect(ensureAbsoluteHttpUrl('https://odwalla.com')).toBe('https://odwalla.com')
    expect(ensureAbsoluteHttpUrl('http://odwalla.com/path')).toBe('http://odwalla.com/path')
  })
})

describe('socialOutboundUrl', () => {
  it('matches BrandScreen SOCIAL_LINKS conventions', () => {
    expect(socialOutboundUrl('instagram_handle', 'odwalla')).toBe('https://instagram.com/odwalla')
    expect(socialOutboundUrl('instagram_handle', '@odwalla')).toBe('https://instagram.com/odwalla')
    expect(socialOutboundUrl('tiktok_handle', 'odwalla')).toBe('https://tiktok.com/@odwalla')
    expect(socialOutboundUrl('x_handle', 'odwalla')).toBe('https://x.com/odwalla')
    expect(socialOutboundUrl('youtube_handle', 'odwalla')).toBe('https://youtube.com/@odwalla')
    expect(socialOutboundUrl('brand_website_url', 'odwalla.com')).toBe('https://odwalla.com')
    expect(socialOutboundUrl('linkedin_url', 'https://linkedin.com/company/odwalla')).toBe(
      'https://linkedin.com/company/odwalla'
    )
  })

  it('returns null for empty', () => {
    expect(socialOutboundUrl('instagram_handle', '')).toBe(null)
    expect(socialOutboundUrl('brand_website_url', '  ')).toBe(null)
  })
})

describe('displaySocialValue', () => {
  it('shows @ for handles and domain for website', () => {
    expect(displaySocialValue('instagram_handle', 'odwalla')).toBe('@odwalla')
    expect(displayWebsite('https://www.odwalla.com/')).toBe('www.odwalla.com')
  })
})
