const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Read `session_id` from a Supabase access token payload without verifying the
 * JWT. Used only to skip a redundant `record_brand_portal_login` call; the
 * database still reads the verified claim from the request.
 */
export function sessionIdFromAccessToken(token?: string | null): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { session_id?: unknown }
    const sid = payload.session_id
    if (typeof sid !== 'string' || !UUID_RE.test(sid)) return null
    return sid
  } catch {
    return null
  }
}

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const b64 = padded + pad
  if (typeof atob === 'function') {
    return decodeURIComponent(
      Array.from(atob(b64), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    )
  }
  return Buffer.from(b64, 'base64').toString('utf8')
}
