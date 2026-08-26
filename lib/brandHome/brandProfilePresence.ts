import type { SocialLinkKey } from '@/lib/brandHome/socialLinks'

/** Display order — website first, then socials. Matches BrandProfileCard LINK_DEFS. */
export const PROFILE_LINK_KEYS: SocialLinkKey[] = [
  'brand_website_url',
  'instagram_handle',
  'tiktok_handle',
  'youtube_handle',
  'x_handle',
  'linkedin_url',
]

export function populatedLinkKeys(values: Record<SocialLinkKey, string>): SocialLinkKey[] {
  return PROFILE_LINK_KEYS.filter((key) => Boolean(values[key]?.trim()))
}

/**
 * Collapsed Home row: website if present, then up to one more populated profile
 * (or two socials if there is no website). Empty slots stay behind Edit.
 */
export function featuredLinkKeys(populated: SocialLinkKey[]): SocialLinkKey[] {
  if (populated.length === 0) return []
  const featured: SocialLinkKey[] = []
  if (populated.includes('brand_website_url')) featured.push('brand_website_url')
  for (const key of populated) {
    if (key === 'brand_website_url') continue
    if (featured.length >= 2) break
    featured.push(key)
  }
  return featured
}

export function hiddenPopulatedLinkKeys(
  populated: SocialLinkKey[],
  featured: SocialLinkKey[]
): SocialLinkKey[] {
  const shown = new Set(featured)
  return populated.filter((key) => !shown.has(key))
}

export function formatLocationLine(city: string, state: string): string | null {
  const c = city.trim()
  const s = state.trim()
  if (c && s) return `${c}, ${s}`
  if (c) return c
  if (s) return s
  return null
}
