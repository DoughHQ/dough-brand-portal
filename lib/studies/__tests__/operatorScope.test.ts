import { describe, expect, it } from 'vitest'
import { operatorStudiesBrandId } from '../operatorScope'
import type { PortalBrandScope } from '@/lib/portal/getPortalBrandScope'

function scope(
  role: PortalBrandScope['portalUser']['role'],
  effectiveBrandId: number,
  isImpersonating = false
): PortalBrandScope {
  return {
    effectiveBrandId,
    isImpersonating,
    impersonatedBrandId: isImpersonating ? effectiveBrandId : null,
    portalUser: {
      portal_user_id: 'portal-user',
      auth_uid: 'auth-user',
      brand_id: 10,
      role,
      display_name: null,
      status: 'active',
      onboarding_completed: true,
      last_login_at: null,
      login_count: 1,
    },
  }
}

describe('operatorStudiesBrandId', () => {
  it('allows a platform admin to query the global operator view', () => {
    expect(operatorStudiesBrandId(scope('dough_admin', 10))).toBeNull()
  })

  it('pins an impersonating admin to the workspace brand', () => {
    expect(operatorStudiesBrandId(scope('dough_admin', 42, true))).toBe(42)
  })

  it.each(['brand_admin', 'brand_viewer'] as const)(
    'pins a %s to its effective brand',
    (role) => {
      expect(operatorStudiesBrandId(scope(role, 42))).toBe(42)
    }
  )
})
