import type { PortalBrandScope } from '@/lib/portal/getPortalBrandScope'

/**
 * Resolve a client-requested study brand without letting a brand workspace,
 * including an impersonated one, escape its effective tenant.
 */
export function studyBrandIdForRequest(
  scope: PortalBrandScope,
  requestedBrandId: number
): number | null {
  if (!Number.isSafeInteger(requestedBrandId) || requestedBrandId <= 0) {
    return null
  }
  if (scope.portalUser.role === 'dough_admin' && !scope.isImpersonating) {
    return requestedBrandId
  }
  return requestedBrandId === scope.effectiveBrandId ? requestedBrandId : null
}
