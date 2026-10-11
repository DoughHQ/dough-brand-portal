import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const callBrandInvite = vi.fn()
const createServerSupabaseClient = vi.fn()
const redirect = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT:${to}`)
})

vi.mock('@/lib/brandInvite.server', () => ({
  callBrandInvite: (...args: unknown[]) => callBrandInvite(...args),
}))
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: (...args: unknown[]) => createServerSupabaseClient(...args),
}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => redirect(to),
}))

import { connectInviteAction, continueInviteAction } from '../../app/invite/[token]/actions'
import { WRONG_PASSWORD_COPY } from '../brandInviteCopy'

const TOKEN = 'B'.repeat(43)

type Calls = string[]

function makeSupabase(opts: {
  session?: boolean
  verifyError?: boolean
  signInError?: boolean
  signInSession?: boolean
}) {
  const calls: Calls = []
  const auth = {
    getUser: vi.fn(async () => ({
      data: { user: opts.session ? { id: 'existing-user', email: 'other@example.com' } : null },
    })),
    signOut: vi.fn(async () => {
      calls.push('signOut')
      return { error: null }
    }),
    verifyOtp: vi.fn(async () => {
      calls.push('verifyOtp')
      return { error: opts.verifyError ? { message: 'bad' } : null }
    }),
    signInWithPassword: vi.fn(async () => {
      calls.push('signInWithPassword')
      if (opts.signInError) return { data: { session: null }, error: { message: 'bad' } }
      return {
        data: { session: opts.signInSession === false ? null : { access_token: 'jwt-after-login' } },
        error: null,
      }
    }),
  }
  createServerSupabaseClient.mockResolvedValue({ auth })
  return { auth, calls }
}

async function redirectTarget(run: () => Promise<unknown>): Promise<string> {
  try {
    await run()
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.startsWith('NEXT_REDIRECT:')) return message.slice('NEXT_REDIRECT:'.length)
    throw err
  }
  throw new Error('expected a redirect')
}

beforeEach(() => {
  callBrandInvite.mockReset()
  createServerSupabaseClient.mockReset()
  redirect.mockClear()
})

describe('continueInviteAction', () => {
  const magic = { ok: true, hashedToken: 'hashed', verificationType: 'magiclink' }

  it('redeems without an access token, verifies the magic link, redirects to /welcome/password', async () => {
    const { auth, calls } = makeSupabase({ session: false })
    callBrandInvite.mockResolvedValue(magic)

    const to = await redirectTarget(() => continueInviteAction(TOKEN))

    expect(to).toBe('/welcome/password')
    expect(callBrandInvite).toHaveBeenCalledTimes(1)
    expect(callBrandInvite).toHaveBeenCalledWith('redeem', TOKEN)
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hashed', type: 'magiclink' })
    expect(auth.signOut).not.toHaveBeenCalled()
    expect(calls).toEqual(['verifyOtp'])
  })

  it('signs out an existing session (local scope) before verifyOtp', async () => {
    const { auth, calls } = makeSupabase({ session: true })
    callBrandInvite.mockResolvedValue(magic)

    await redirectTarget(() => continueInviteAction(TOKEN))

    expect(calls).toEqual(['signOut', 'verifyOtp'])
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it.each(['expired', 'used', 'revoked', 'has_account', 'error'] as const)(
    'returns %s without touching auth',
    async (state) => {
      const { auth } = makeSupabase({ session: true })
      callBrandInvite.mockResolvedValue({ ok: false, state })

      const res = await continueInviteAction(TOKEN)

      expect(res).toMatchObject({ ok: false, state })
      expect(auth.signOut).not.toHaveBeenCalled()
      expect(auth.verifyOtp).not.toHaveBeenCalled()
      expect(redirect).not.toHaveBeenCalled()
    }
  )

  it('treats a connected-shaped response on the continue path as an error', async () => {
    const { auth } = makeSupabase({ session: false })
    callBrandInvite.mockResolvedValue({ ok: true, connected: true })
    expect(await continueInviteAction(TOKEN)).toMatchObject({ ok: false, state: 'error' })
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('returns an error (no redirect) when verifyOtp fails', async () => {
    makeSupabase({ session: false, verifyError: true })
    callBrandInvite.mockResolvedValue(magic)
    expect(await continueInviteAction(TOKEN)).toMatchObject({ ok: false, state: 'error' })
    expect(redirect).not.toHaveBeenCalled()
  })
})

describe('connectInviteAction', () => {
  const peekHasAccount = {
    ok: true,
    state: 'has_account',
    brandName: 'Acme',
    invitedEmail: 'Owner@Acme.com',
  }

  it('signs in with the trimmed password, redeems with the access token, redirects to /dashboard?welcome=1', async () => {
    const { auth, calls } = makeSupabase({ session: true })
    callBrandInvite.mockImplementation(async (action: string) =>
      action === 'peek' ? peekHasAccount : { ok: true, connected: true }
    )

    const to = await redirectTarget(() => connectInviteAction(TOKEN, '  hunter22  '))

    expect(to).toBe('/dashboard?welcome=1')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@acme.com',
      password: 'hunter22',
    })
    expect(callBrandInvite).toHaveBeenLastCalledWith('redeem', TOKEN, {
      accessToken: 'jwt-after-login',
    })
    // has_account path never uses a magic link.
    expect(auth.verifyOtp).not.toHaveBeenCalled()
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(calls).toEqual(['signOut', 'signInWithPassword'])
  })

  it('returns the documented wrong-password copy and does not redeem', async () => {
    const { auth } = makeSupabase({ signInError: true })
    callBrandInvite.mockResolvedValue(peekHasAccount)

    const res = await connectInviteAction(TOKEN, 'nope')

    expect(res).toEqual({ ok: false, state: 'wrong_password', message: WRONG_PASSWORD_COPY })
    expect(callBrandInvite).toHaveBeenCalledTimes(1)
    expect(callBrandInvite).toHaveBeenCalledWith('peek', TOKEN)
    expect(auth.verifyOtp).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('rejects a blank password before any network call', async () => {
    const { auth } = makeSupabase({})
    const res = await connectInviteAction(TOKEN, '   ')
    expect(res).toMatchObject({ ok: false, state: 'wrong_password' })
    expect(callBrandInvite).not.toHaveBeenCalled()
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it.each(['valid', 'used', 'expired'] as const)(
    'does not sign in when the invite is %s at connect time',
    async (state) => {
      const { auth } = makeSupabase({})
      callBrandInvite.mockResolvedValue({ ok: true, state, brandName: 'Acme', invitedEmail: 'a@b.co' })
      const res = await connectInviteAction(TOKEN, 'password1')
      expect(res).toMatchObject({ ok: false })
      expect(auth.signInWithPassword).not.toHaveBeenCalled()
      expect(auth.verifyOtp).not.toHaveBeenCalled()
    }
  )

  it('returns the redeem refusal state without redirecting or verifyOtp', async () => {
    const { auth } = makeSupabase({})
    callBrandInvite.mockImplementation(async (action: string) =>
      action === 'peek' ? peekHasAccount : { ok: false, state: 'other_brand' }
    )
    const res = await connectInviteAction(TOKEN, 'password1')
    expect(res).toMatchObject({ ok: false, state: 'other_brand' })
    expect(auth.verifyOtp).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('returns an error when sign-in yields no session', async () => {
    makeSupabase({ signInSession: false })
    callBrandInvite.mockResolvedValue(peekHasAccount)
    expect(await connectInviteAction(TOKEN, 'password1')).toMatchObject({
      ok: false,
      state: 'error',
    })
    expect(callBrandInvite).toHaveBeenCalledTimes(1)
  })

  it('never calls verifyOtp even if redeem unexpectedly returns a magic link', async () => {
    const { auth } = makeSupabase({})
    callBrandInvite.mockImplementation(async (action: string) =>
      action === 'peek'
        ? peekHasAccount
        : { ok: true, hashedToken: 'h', verificationType: 'magiclink' }
    )
    expect(await connectInviteAction(TOKEN, 'password1')).toMatchObject({ ok: false })
    expect(auth.verifyOtp).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })
})
