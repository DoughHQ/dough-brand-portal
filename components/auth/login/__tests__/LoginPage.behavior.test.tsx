// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  onAuthStateChange: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signInWithPassword: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

import LoginPage from '@/app/login/page'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
  window.history.replaceState(null, '', '/login')
  mocks.push.mockReset()
  mocks.replace.mockReset()
  mocks.resetPasswordForEmail.mockReset()
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null })
  mocks.signInWithPassword.mockReset()
  mocks.unsubscribe.mockReset()
  mocks.onAuthStateChange.mockReset()
  mocks.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mocks.unsubscribe } },
  })
  mocks.createClient.mockReset()
  mocks.createClient.mockReturnValue({
    auth: {
      onAuthStateChange: mocks.onAuthStateChange,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signInWithPassword: mocks.signInWithPassword,
    },
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

describe('LoginPage behavior', () => {
  it('shows an expired-link error from the URL and removes the query string', async () => {
    window.history.replaceState(null, '', '/login?error_code=otp_expired')

    render(<LoginPage />)

    expect(
      await screen.findByText(
        'This reset link has expired or was already used. Request a new one below.',
      ),
    ).toBeTruthy()
    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toBe('')
  })

  it('copies the login email into the forgot-password step and requests a reset', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await waitFor(() => expect(mocks.onAuthStateChange).toHaveBeenCalledOnce())

    await user.type(screen.getByPlaceholderText('you@brand.com'), 'Person@Example.com')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))

    const forgotEmail = screen.getByPlaceholderText('you@brand.com')
    expect((forgotEmail as HTMLInputElement).value).toBe('Person@Example.com')

    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('person@example.com', {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })
    expect(
      await screen.findByText(
        'If an account exists for that email, a reset link is on its way. Open it in this same browser.',
      ),
    ).toBeTruthy()
  })
})
