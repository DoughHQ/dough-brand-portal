import 'server-only'

import { getPortalBrandScope } from './getPortalBrandScope'
import type { PortalBrandScope } from './getPortalBrandScope'

export function isDoughAdminScope(
  scope: PortalBrandScope | null
): boolean {
  return scope?.portalUser.role === 'dough_admin'
}

/**
 * Defense-in-depth gate for server actions. Database policies and RPCs remain
 * authoritative, but an admin action must reject before touching its data API.
 * Impersonation changes tenant context, not staff identity; operations that
 * must run only outside a workspace also check `scope.isImpersonating`.
 */
export async function isDoughAdminRequest(): Promise<boolean> {
  const scope = await getPortalBrandScope()
  return isDoughAdminScope(scope)
}
