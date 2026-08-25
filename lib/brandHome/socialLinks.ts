/**
 * Outbound URL builders — mirror consumer BrandScreen SOCIAL_LINKS verbatim.
 * Handles are stored bare (no @). Instagram/X: no @ in path; TikTok/YouTube: @ in path.
 */

export type SocialLinkKey =
  | 'brand_website_url'
  | 'instagram_handle'
  | 'tiktok_handle'
  | 'youtube_handle'
  | 'x_handle'
  | 'linkedin_url'

const HANDLE_KEYS = new Set<SocialLinkKey>([
  'instagram_handle',
  'tiktok_handle',
  'youtube_handle',
  'x_handle',
])

export function isHandleField(key: SocialLinkKey): boolean {
  return HANDLE_KEYS.has(key)
}

/** Bare handle for storage / edit / URL path segment. */
export function bareHandle(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.trim().replace(/^@+/, '')
}

/**
 * Ensure absolute http(s) href. Scheme-less values must not become portal-relative paths.
 */
export function ensureAbsoluteHttpUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`
  // Reject obvious non-URL junk
  if (/\s/.test(trimmed)) return null
  return `https://${trimmed}`
}

/** Readable domain/path for website display (no scheme clutter). */
export function displayWebsite(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  try {
    const withScheme = ensureAbsoluteHttpUrl(trimmed)
    if (!withScheme) return trimmed
    const u = new URL(withScheme)
    return `${u.host}${u.pathname === '/' ? '' : u.pathname}`.replace(/\/$/, '')
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  }
}

/** Display label for a stored social value (@ for handles). */
export function displaySocialValue(key: SocialLinkKey, stored: string): string {
  if (!stored) return ''
  if (isHandleField(key)) return `@${bareHandle(stored)}`
  if (key === 'brand_website_url') return displayWebsite(stored)
  return stored.trim()
}

/**
 * Build outbound href from stored field value.
 * Matches BrandScreen.tsx SOCIAL_LINKS toUrl conventions.
 */
export function socialOutboundUrl(key: SocialLinkKey, stored: string | null | undefined): string | null {
  if (!stored || !stored.trim()) return null
  const v = stored.trim()

  switch (key) {
    case 'brand_website_url':
    case 'linkedin_url':
      return ensureAbsoluteHttpUrl(v)
    case 'instagram_handle':
      return `https://instagram.com/${bareHandle(v)}`
    case 'tiktok_handle':
      return `https://tiktok.com/@${bareHandle(v)}`
    case 'x_handle':
      return `https://x.com/${bareHandle(v)}`
    case 'youtube_handle':
      return `https://youtube.com/@${bareHandle(v)}`
    default:
      return null
  }
}
