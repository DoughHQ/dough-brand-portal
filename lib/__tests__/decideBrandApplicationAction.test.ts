import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPortalBrandScope = vi.fn()
const createServerSupabaseClient = vi.fn()

vi.mock('@/lib/portal/getPortalBrandScope', () => ({
  getPortalBrandScope: (...args: unknown[]) => getPortalBrandScope(...args),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: (...args: unknown[]) => createServerSupabaseClient(...args),
}))

const actionsPath = '../../app/(portal)/admin/brand-applications/actions'

function jwtWithClaim(claim: number | null): string {
  const payload =
    claim == null
      ? { sub: 'admin', role: 'authenticated' }
      : { sub: 'admin', role: 'authenticated', impersonated_brand_id: String(claim) }
  const enc = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc(payload)}.sig`
}

function adminScope(overrides: Record<string, unknown> = {}) {
  return {
    portalUser: { role: 'dough_admin', brand_id: 1 },
    isImpersonating: false,
    effectiveBrandId: null,
    impersonatedBrandId: null,
    ...overrides,
  }
}

describe('decideBrandApplicationAction', () => {
  beforeEach(() => {
    vi.resetModules()
    getPortalBrandScope.mockReset()
    createServerSupabaseClient.mockReset()
    vi.unstubAllGlobals()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  })

  it('refuses while impersonating without calling fetch', async () => {
    getPortalBrandScope.mockResolvedValue(
      adminScope({ isImpersonating: true, effectiveBrandId: 9, impersonatedBrandId: 9 })
    )
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('impersonating')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('refuses when JWT claim equals the admin brand before fetch', async () => {
    getPortalBrandScope.mockResolvedValue(adminScope())
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: jwtWithClaim(1) } },
        }),
      },
    })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('impersonating')
    expect(res.error).toMatch(/stop impersonating/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('POSTs the session token and action body', async () => {
    getPortalBrandScope.mockResolvedValue(adminScope())
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: jwtWithClaim(null) } },
        }),
      },
    })
    const fetchSpy = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        ok: true,
        invitation_id: 'inv-1',
        invited_email: 'jane@brand.com',
        sent: true,
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      brandName: 'New Co',
      confirmNew: true,
    })
    expect(res.ok).toBe(true)
    expect(res.sent).toBe(true)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/functions/v1/brand_application_decision')
    expect((init.headers as Record<string, string>).Authorization).toMatch(/^Bearer /)
    expect(JSON.parse(String(init.body))).toEqual({
      action: 'approve',
      waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      brand_name: 'New Co',
      confirm_new: true,
    })
  })

  it('maps invites_disabled from a 409', async () => {
    getPortalBrandScope.mockResolvedValue(adminScope())
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: jwtWithClaim(null) } },
        }),
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 409,
        ok: false,
        json: async () => ({ ok: false, error: 'invites_disabled' }),
      })
    )

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('invites_disabled')
    expect(res.error).toMatch(/switched off/i)
  })

  it('maps ok:false 200 business refusals to friendly copy + code', async () => {
    getPortalBrandScope.mockResolvedValue(adminScope())
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: jwtWithClaim(null) } },
        }),
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          ok: false,
          error: 'brand_has_pending_invite',
          invited_email: 'alex@brand.com',
        }),
      })
    )

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('brand_has_pending_invite')
    expect(res.error).toMatch(/^alex@brand\.com already has a pending invite/)
    expect(res.error).not.toBe('brand_has_pending_invite')
  })

  it('maps 500 rpc_failed to wasn’t-saved copy', async () => {
    getPortalBrandScope.mockResolvedValue(adminScope())
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: jwtWithClaim(null) } },
        }),
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: async () => ({ ok: false, error: 'rpc_failed' }),
      })
    )

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('rpc_failed')
    expect(res.error).toMatch(/wasn’t saved/i)
  })

  it('maps gateway 502 with no JSON body to ambiguous confirm copy', async () => {
    getPortalBrandScope.mockResolvedValue(adminScope())
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: jwtWithClaim(null) } },
        }),
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 502,
        ok: false,
        json: async () => {
          throw new Error('not json')
        },
      })
    )

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('unknown')
    expect(res.error).toMatch(/Couldn’t confirm whether it went through/i)
    expect(res.error).not.toMatch(/Nothing was changed/i)
  })

  it('maps 401 to session-expired copy', async () => {
    getPortalBrandScope.mockResolvedValue(adminScope())
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: jwtWithClaim(null) } },
        }),
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ ok: false, error: 'not_authorized' }),
      })
    )

    const { decideBrandApplicationAction } = await import(actionsPath)
    const res = await decideBrandApplicationAction({
      action: 'approve',
      waitlistId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('401')
    expect(res.error).toMatch(/session expired/i)
  })
})
