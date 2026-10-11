import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { callBrandInvite } from '../brandInvite.server'

const TOKEN = 'A'.repeat(43)
const SECRET = 'portal-secret-value'
const ANON = 'eyJ.anon.key'
const URL_BASE = 'https://example.supabase.co'

function jsonResponse(status: number, body: unknown) {
  return { status, ok: status < 400, json: async () => body }
}

describe('callBrandInvite', () => {
  const logSpies: ReturnType<typeof vi.spyOn>[] = []

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = URL_BASE
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON
    process.env.BRAND_INVITE_PORTAL_SECRET = SECRET
    for (const m of ['log', 'info', 'warn', 'error', 'debug'] as const) {
      logSpies.push(vi.spyOn(console, m).mockImplementation(() => {}))
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    logSpies.splice(0).forEach((s) => s.mockRestore())
    delete process.env.BRAND_INVITE_PORTAL_SECRET
  })

  it.each(['', 'short', 'A'.repeat(42), 'A'.repeat(44), `${'A'.repeat(42)}!`, `${'A'.repeat(42)} `])(
    'returns invalid without fetching for malformed token %j',
    async (token) => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
      const res = await callBrandInvite('peek', token)
      expect(res).toMatchObject({ ok: false, state: 'invalid' })
      expect(fetchSpy).not.toHaveBeenCalled()
    }
  )

  it('returns error without fetching when the portal secret is unset', async () => {
    delete process.env.BRAND_INVITE_PORTAL_SECRET
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await callBrandInvite('peek', TOKEN)
    expect(res).toEqual({ ok: false, state: 'error' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts to the edge function with anon apikey/bearer, secret, no-store and a timeout', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { ok: true, state: 'valid', brand_name: 'Acme', invited_email: 'a@b.co' })
      )
    vi.stubGlobal('fetch', fetchSpy)

    const res = await callBrandInvite('peek', TOKEN)
    expect(res).toEqual({ ok: true, state: 'valid', brandName: 'Acme', invitedEmail: 'a@b.co' })

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${URL_BASE}/functions/v1/brand_invite`)
    expect(init.method).toBe('POST')
    expect(init.cache).toBe('no-store')
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(init.headers).toMatchObject({
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      'x-brand-invite-secret': SECRET,
    })
    expect(JSON.parse(init.body)).toEqual({ action: 'peek', token: TOKEN })
  })

  it('sends access_token only on redeem', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, connected: true }))
    vi.stubGlobal('fetch', fetchSpy)

    const res = await callBrandInvite('redeem', TOKEN, { accessToken: 'jwt-value' })
    expect(res).toEqual({ ok: true, connected: true })
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toEqual({
      action: 'redeem',
      token: TOKEN,
      access_token: 'jwt-value',
    })

    await callBrandInvite('peek', TOKEN, { accessToken: 'jwt-value' })
    expect(JSON.parse(fetchSpy.mock.calls[1][1].body)).toEqual({ action: 'peek', token: TOKEN })
  })

  it('maps a redeem magic link', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(200, { ok: true, hashed_token: 'hash', verification_type: 'magiclink' })
        )
    )
    expect(await callBrandInvite('redeem', TOKEN)).toEqual({
      ok: true,
      hashedToken: 'hash',
      verificationType: 'magiclink',
    })
  })

  it('maps redeem refusals to their state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { ok: false, state: 'expired' }))
    )
    expect(await callBrandInvite('redeem', TOKEN)).toEqual({ ok: false, state: 'expired' })
  })

  it('maps unknown states and malformed success bodies to error', async () => {
    const bodies: [string, unknown][] = [
      ['peek', { ok: true, state: 'mystery' }],
      ['peek', { ok: true, state: 'valid' }],
      ['peek', { ok: true, state: 'has_account', brand_name: 'Acme' }],
      ['redeem', { ok: true }],
      ['redeem', { ok: true, hashed_token: 'h', verification_type: 'recovery' }],
      ['redeem', { ok: false, state: 'mystery' }],
      ['redeem', ['array']],
    ]
    for (const [action, body] of bodies) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, body)))
      expect(await callBrandInvite(action as 'peek' | 'redeem', TOKEN)).toEqual({
        ok: false,
        state: 'error',
      })
    }
  })

  it('maps network failure to error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(`boom ${SECRET}`)))
    expect(await callBrandInvite('peek', TOKEN)).toEqual({ ok: false, state: 'error' })
  })

  it('maps a timeout abort to error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    )
    expect(await callBrandInvite('peek', TOKEN)).toEqual({ ok: false, state: 'error' })
  })

  it('maps 401 / 400 / 5xx to error even when the body names a state', async () => {
    for (const status of [401, 400, 500, 502]) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(status, { ok: false, state: 'expired' }))
      )
      expect(await callBrandInvite('peek', TOKEN)).toEqual({ ok: false, state: 'error' })
    }
  })

  it('maps a non-JSON body to error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
      })
    )
    expect(await callBrandInvite('peek', TOKEN)).toEqual({ ok: false, state: 'error' })
  })

  it('never logs the token, secret, or response values', async () => {
    const scenarios = [
      vi.fn().mockRejectedValue(new Error(`${TOKEN} ${SECRET}`)),
      vi.fn().mockResolvedValue(jsonResponse(401, { ok: false, state: 'unauthorized' })),
      vi.fn().mockResolvedValue(
        jsonResponse(200, { ok: true, hashed_token: 'hashed-secret', verification_type: 'magiclink' })
      ),
      vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, state: 'valid', invited_email: 'x@y.z', brand_name: 'B' })),
    ]
    for (const fetchSpy of scenarios) {
      vi.stubGlobal('fetch', fetchSpy)
      await callBrandInvite('redeem', TOKEN, { accessToken: 'jwt-value' })
      await callBrandInvite('peek', TOKEN)
    }
    const logged = logSpies.flatMap((s) => s.mock.calls).flat().map(String).join('\n')
    expect(logged).toBe('')
  })
})
