import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const getSession = vi.fn()
const createServerSupabaseClient = vi.fn(async () => ({
  auth: { getSession },
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => createServerSupabaseClient(),
}))

import { moderateBrandPhoto } from '../brandPhoto.server'

const UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const HOLDING = `20040698/holding/${UUID}.jpg`
const SHA = 'ab'.repeat(32)
const PUBLISHED = `20040698/products/${SHA}.jpg`
const TOKEN = 'session-token-do-not-log'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  getSession.mockReset()
  getSession.mockResolvedValue({ data: { session: { access_token: TOKEN } } })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('moderateBrandPhoto', () => {
  it('refuses a bad holding path before any fetch', async () => {
    const paths = [
      `20040698/products/${SHA}.jpg`,
      `20040698/holding/${UUID}.png`,
      `20040698/holding/../${UUID}.jpg`,
      `20040698/holding/${UUID.toUpperCase()}.jpg`,
      `holding/${UUID}.jpg`,
      `020040698/holding/${UUID}.jpg`,
    ]
    for (const holdingPath of paths) {
      await expect(moderateBrandPhoto({ holdingPath })).resolves.toEqual({
        ok: false,
        code: 'invalid_path',
      })
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports a missing session', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: false,
      code: 'session_expired',
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('treats HTTP 401 as a dead session, including a not_authorized body and a non-JSON body', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { ok: false, error: 'not_authorized' }))
      .mockResolvedValueOnce(new Response('nope', { status: 401 }))
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: false,
      code: 'session_expired',
    })
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: false,
      code: 'session_expired',
    })
  })

  it('passes moderation codes through after the status check', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(403, { ok: false, error: 'not_authorized' }))
      .mockResolvedValueOnce(jsonResponse(422, { ok: false, error: 'community_standards' }))
      .mockResolvedValueOnce(jsonResponse(409, { ok: false, error: 'changed' }))
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: false,
      code: 'not_authorized',
    })
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: false,
      code: 'community_standards',
    })
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: false,
      code: 'changed',
    })
  })

  it('rejects a non-JSON success, a foreign path, a uuid name and a missing path', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('html', { status: 200 }))
      .mockResolvedValueOnce(
        jsonResponse(200, { ok: true, storage_path: `9/products/${SHA}.jpg`, public_url: 'u' }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          ok: true,
          storage_path: `20040698/products/${UUID}.jpg`,
          public_url: 'u',
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, public_url: 'u' }))
    for (let i = 0; i < 4; i += 1) {
      await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
        ok: false,
        code: 'check_failed',
      })
    }
  })

  it('maps a thrown fetch to check_failed', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('timeout'))
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: false,
      code: 'check_failed',
    })
  })

  it('returns the server path and sends only the holding path', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        ok: true,
        storage_path: PUBLISHED,
        public_url: 'https://cdn.example/pack.jpg',
        sha256: SHA,
      }),
    )
    await expect(moderateBrandPhoto({ holdingPath: HOLDING })).resolves.toEqual({
      ok: true,
      storagePath: PUBLISHED,
      publicUrl: 'https://cdn.example/pack.jpg',
    })
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call?.[0]).toBe('https://example.supabase.co/functions/v1/moderate_brand_image')
    const init = call?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.cache).toBe('no-store')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe(`Bearer ${TOKEN}`)
    expect(JSON.parse(String(init?.body))).toEqual({ holding_path: HOLDING })
    const logged = [console.log, console.info, console.error, console.warn].flatMap((fn) =>
      vi.mocked(fn).mock.calls.flat().map(String),
    )
    expect(logged.join('\n')).not.toContain(TOKEN)
  })
})
