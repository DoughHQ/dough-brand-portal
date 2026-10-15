import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getUser = vi.fn()
const getSession = vi.fn()
const rpc = vi.fn()
const logHandledRpcFailure = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser, getSession },
    rpc,
  }),
}))

vi.mock('@/lib/portal/logHandledRpcFailure', () => ({
  logHandledRpcFailure: (...args: unknown[]) => logHandledRpcFailure(...args),
}))

import { proxy, SIGNIN_SID_COOKIE } from '../../../proxy'

const SID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

function tokenFor(sid: string): string {
  const payload = Buffer.from(JSON.stringify({ session_id: sid }), 'utf8').toString('base64url')
  return `h.${payload}.s`
}

function req(path: string, cookie?: string): NextRequest {
  const headers = new Headers()
  if (cookie) headers.set('cookie', `${SIGNIN_SID_COOKIE}=${cookie}`)
  return new NextRequest(new URL(path, 'http://localhost:3000'), { headers })
}

beforeEach(() => {
  getUser.mockReset()
  getSession.mockReset()
  rpc.mockReset()
  logHandledRpcFailure.mockReset()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
})

describe('proxy sign-in recording', () => {
  it('skips RPC when the cookie already matches the session', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    getSession.mockResolvedValue({ data: { session: { access_token: tokenFor(SID) } } })

    await proxy(req('/dashboard', SID))

    expect(rpc).not.toHaveBeenCalled()
  })

  it('calls RPC once and sets the cookie when missing', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    getSession.mockResolvedValue({ data: { session: { access_token: tokenFor(SID) } } })
    rpc.mockResolvedValue({ data: SID, error: null })

    const res = await proxy(req('/dashboard'))

    expect(rpc).toHaveBeenCalledWith('record_brand_portal_login')
    expect(res.cookies.get(SIGNIN_SID_COOKIE)?.value).toBe(SID)
  })

  it('does not set the cookie when the RPC errors; request still passes', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    getSession.mockResolvedValue({ data: { session: { access_token: tokenFor(SID) } } })
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } })

    const res = await proxy(req('/home'))

    expect(res.cookies.get(SIGNIN_SID_COOKIE)).toBeUndefined()
    expect(logHandledRpcFailure).toHaveBeenCalledWith(
      'record_brand_portal_login',
      expect.objectContaining({ code: '42501', message: null })
    )
  })

  it('skips RPC on /auth/callback', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    await proxy(req('/auth/callback'))

    expect(getSession).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('skips RPC when signed out', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    await proxy(req('/login'))

    expect(getSession).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
})
