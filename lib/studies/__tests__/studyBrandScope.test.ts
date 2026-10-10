import { describe, expect, it } from 'vitest'
import { studyBrandIdForRequest } from '../studyBrandScope'
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

describe('studyBrandIdForRequest', () => {
  it('allows a platform admin to choose a brand', () => {
    expect(studyBrandIdForRequest(scope('dough_admin', 10), 42)).toBe(42)
  })

  it('pins an impersonating admin to the effective workspace brand', () => {
    const impersonating = scope('dough_admin', 42, true)
    expect(studyBrandIdForRequest(impersonating, 42)).toBe(42)
    expect(studyBrandIdForRequest(impersonating, 99)).toBeNull()
  })

  it('prevents a brand user from requesting another tenant', () => {
    const brandUser = scope('brand_admin', 42)
    expect(studyBrandIdForRequest(brandUser, 42)).toBe(42)
    expect(studyBrandIdForRequest(brandUser, 99)).toBeNull()
  })

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid brand id %s', (brandId) => {
    expect(studyBrandIdForRequest(scope('dough_admin', 10), brandId)).toBeNull()
  })
})
