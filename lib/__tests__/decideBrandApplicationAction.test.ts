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

describe('decideBrandApplicationAction', () => {
  beforeEach(() => {
    vi.resetModules()
    getPortalBrandScope.mockReset()
    createServerSupabaseClient.mockReset()
    vi.unstubAllGlobals()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  })

  it('refuses while impersonating without calling fetch', async () => {
    getPortalBrandScope.mockResolvedValue({
      portalUser: { role: 'dough_admin' },
      isImpersonating: true,
      effectiveBrandId: 9,
      impersonatedBrandId: 9,
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
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('POSTs the session token and action body', async () => {
    getPortalBrandScope.mockResolvedValue({
      portalUser: { role: 'dough_admin' },
      isImpersonating: false,
      effectiveBrandId: null,
      impersonatedBrandId: null,
    })
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: 'tok-abc' } },
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
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-abc')
    expect(JSON.parse(String(init.body))).toEqual({
      action: 'approve',
      waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      brand_name: 'New Co',
      confirm_new: true,
    })
  })

  it('maps invites_disabled from a 409', async () => {
    getPortalBrandScope.mockResolvedValue({
      portalUser: { role: 'dough_admin' },
      isImpersonating: false,
      effectiveBrandId: null,
      impersonatedBrandId: null,
    })
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getSession: async () => ({
          data: { session: { access_token: 'tok-abc' } },
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
})
