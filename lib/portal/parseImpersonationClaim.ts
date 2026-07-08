/**
 * impersonated_brand_id is a top-level JWT claim (sibling of sub, role, app_metadata).
 * It is NOT in app_metadata or user_metadata — decode session.access_token to read it.
 *
 * Staging verification (PR1): after enterImpersonationAction + refreshSession, decode the
 * access token at jwt.io and confirm top-level `"impersonated_brand_id": "<brandId>"`.
 */

export function decodeJwtPayload(
  accessToken: string
): Record<string, unknown> | null {
  const parts = accessToken.split('.')
  if (parts.length !== 3) return null

  try {
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(padded, 'base64').toString('utf8')
        : atob(padded)
    const payload = JSON.parse(json) as Record<string, unknown>
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}

/**
 * Read top-level impersonated_brand_id from a Supabase access token.
 * The auth hook emits this value as a string.
 */
export function parseImpersonatedBrandIdFromAccessToken(
  accessToken: string
): number | null {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) return null

  const raw = payload.impersonated_brand_id
  if (raw == null) return null

  const parsed = parseInt(String(raw), 10)
  return Number.isFinite(parsed) ? parsed : null
}
