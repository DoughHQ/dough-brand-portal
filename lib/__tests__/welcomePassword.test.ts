import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const getUser = vi.fn()
const updateUser = vi.fn()
const createServerSupabaseClient = vi.fn()
const fetchPortalAccountNeedsPassword = vi.fn()
const getPortalUser = vi.fn()
const redirect = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT:${to}`)
})

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: (...args: unknown[]) => createServerSupabaseClient(...args),
}))
vi.mock('@/lib/portal/needsPassword.server', () => ({
  fetchPortalAccountNeedsPassword: () => fetchPortalAccountNeedsPassword(),
}))
vi.mock('@/lib/queries', () => ({
  getPortalUser: () => getPortalUser(),
}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => redirect(to),
}))

import WelcomePasswordPage from '../../app/welcome/password/page'
import { setWelcomePasswordAction } from '../../app/welcome/password/actions'
import { MIN_PASSWORD_LENGTH, validateNewPassword } from '../auth/passwordRules'

async function redirectTarget(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run()
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.startsWith('NEXT_REDIRECT:')) return message.slice('NEXT_REDIRECT:'.length)
    throw err
  }
  return null
}

beforeEach(() => {
  getUser.mockReset()
  updateUser.mockReset()
  createServerSupabaseClient.mockReset()
  fetchPortalAccountNeedsPassword.mockReset()
  getPortalUser.mockReset()
  redirect.mockClear()
  createServerSupabaseClient.mockResolvedValue({ auth: { getUser, updateUser } })
})

describe('validateNewPassword', () => {
  it('requires the minimum length, no edge spaces, and a matching confirm', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
    expect(validateNewPassword('abc1234', 'abc1234')).not.toBeNull()
    expect(validateNewPassword(' abcd1234', ' abcd1234')).toBe(
      "Passwords can't start or end with a space."
    )
    expect(validateNewPassword('abcd1234 ', 'abcd1234 ')).toBe(
      "Passwords can't start or end with a space."
    )
    expect(validateNewPassword('abcd1234', 'abcd12345')).toBe('Passwords do not match.')
    expect(validateNewPassword('abcd1234', 'abcd1234')).toBeNull()
  })
})

describe('/welcome/password gate', () => {
  it('sends a signed-out visitor to /login', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect(await redirectTarget(() => WelcomePasswordPage())).toBe('/login')
    expect(fetchPortalAccountNeedsPassword).not.toHaveBeenCalled()
  })

  it('sends a signed-in user without membership to /login', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.co' } } })
    getPortalUser.mockResolvedValue(null)
    expect(await redirectTarget(() => WelcomePasswordPage())).toBe('/login')
  })

  it('sends a signed-in account that already has a password to /dashboard', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.co' } } })
    getPortalUser.mockResolvedValue({ portal_user_id: 'p1' })
    fetchPortalAccountNeedsPassword.mockResolvedValue(false)
    expect(await redirectTarget(() => WelcomePasswordPage())).toBe('/dashboard')
  })

  it('renders the form for a signed-in account that needs a password', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.co' } } })
    getPortalUser.mockResolvedValue({ portal_user_id: 'p1' })
    fetchPortalAccountNeedsPassword.mockResolvedValue(true)
    const element = await WelcomePasswordPage()
    expect(element).toBeTruthy()
  })
})

describe('setWelcomePasswordAction', () => {
  it('rejects a short password without calling updateUser', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    getPortalUser.mockResolvedValue({ portal_user_id: 'p1' })
    fetchPortalAccountNeedsPassword.mockResolvedValue(true)
    const res = await setWelcomePasswordAction('short', 'short')
    expect(res).toEqual({ ok: false, error: 'Use at least 8 characters.' })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('saves and redirects to /dashboard?welcome=1', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    getPortalUser.mockResolvedValue({ portal_user_id: 'p1' })
    fetchPortalAccountNeedsPassword.mockResolvedValue(true)
    updateUser.mockResolvedValue({ error: null })
    expect(
      await redirectTarget(() => setWelcomePasswordAction('abcd1234', 'abcd1234'))
    ).toBe('/dashboard?welcome=1')
    expect(updateUser).toHaveBeenCalledWith({ password: 'abcd1234' })
  })
})
