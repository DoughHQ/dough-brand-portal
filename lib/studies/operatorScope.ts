import type { PortalBrandScope } from '@/lib/portal/getPortalBrandScope'

/**
 * Global operators may see all studies. Brand users and impersonating
 * operators are always pinned to the effective workspace brand.
 */
export function operatorStudiesBrandId(scope: PortalBrandScope): number | null {
  if (scope.portalUser.role === 'dough_admin' && !scope.isImpersonating) {
    return null
  }
  return scope.effectiveBrandId
}
