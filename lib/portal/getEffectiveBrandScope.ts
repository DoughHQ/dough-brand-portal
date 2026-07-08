import type { PortalUser } from '@/lib/queries'
import { parseImpersonatedBrandIdFromAccessToken } from './parseImpersonationClaim'

export type EffectiveBrandScope = {
  effectiveBrandId: number
  isImpersonating: boolean
  /** Set only when admin is impersonating a brand other than their portal row. */
  impersonatedBrandId: number | null
}

/**
 * Resolve the brand scope for portal reads from the session JWT.
 * Only dough_admin users honor impersonated_brand_id; brand users always get portalUser.brand_id.
 */
export function getEffectiveBrandScope(
  portalUser: PortalUser,
  accessToken: string | null | undefined
): EffectiveBrandScope {
  const claimBrandId =
    portalUser.role === 'dough_admin' && accessToken
      ? parseImpersonatedBrandIdFromAccessToken(accessToken)
      : null

  const effectiveBrandId = claimBrandId ?? portalUser.brand_id

  const isImpersonating =
    portalUser.role === 'dough_admin' &&
    claimBrandId != null &&
    claimBrandId !== portalUser.brand_id

  return {
    effectiveBrandId,
    isImpersonating,
    impersonatedBrandId: isImpersonating ? claimBrandId : null,
  }
}
