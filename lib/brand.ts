/**
 * Portal brand / domain constants.
 *
 * Display product name stays "Dough" until Train B + Runoff mark kit
 * (dough repo docs/runoff-phase0-decisions.md). Do not put storage keys here.
 */

/** User-visible product name — flip once for Train B. */
export const PRODUCT_NAME = 'Dough'

export const MARKETING_ORIGIN = 'https://www.itsarunoff.com'

/** Canonical brand-portal origin (Train A). */
export const PORTAL_ORIGIN = 'https://brands.itsarunoff.com'

const LEGACY_PORTAL_HOST = 'brands.godough.co'

/**
 * Normalize a portal origin for Auth redirects.
 * Legacy godough host rewrites to {@link PORTAL_ORIGIN}; empty → null.
 */
export function normalizePortalOrigin(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim().replace(/\/$/, '')
  if (!trimmed) return null
  if (trimmed.includes(LEGACY_PORTAL_HOST)) return PORTAL_ORIGIN
  return trimmed
}

/**
 * Origin used for password-reset / Auth `redirectTo`.
 * Prefer `NEXT_PUBLIC_APP_URL`, then `window.location.origin`, then
 * {@link PORTAL_ORIGIN}. Never returns the legacy godough host.
 */
export function getPortalAppUrl(): string {
  const fromEnv = normalizePortalOrigin(process.env.NEXT_PUBLIC_APP_URL)
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') {
    return normalizePortalOrigin(window.location.origin) ?? PORTAL_ORIGIN
  }
  return PORTAL_ORIGIN
}

export {
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  supportHref,
} from '@/lib/productMaster/support'
