import { describe, expect, it } from 'vitest'
import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthWeakPasswordError,
} from '@supabase/supabase-js'
import {
  APPLY_WHILE_AUTH_COPY,
  applyWaitlistInsertErrorCopy,
  passwordUpdateErrorCopy,
  resetRequestErrorCopy,
  signInErrorCopy,
} from '../authErrorCopy'
import { WRONG_PASSWORD_COPY } from '@/lib/brandInviteCopy'
import { PRODUCT_NAME } from '@/lib/brand'
import { SUPPORT_EMAIL } from '@/lib/productMaster/support'

describe('passwordUpdateErrorCopy', () => {
  it('same_password (422 Kyle hit)', () => {
    const err = new AuthApiError(
      'New password should be different from the old password.',
      422,
      'same_password'
    )
    expect(passwordUpdateErrorCopy(err, 'reset')).toEqual({
      message: "That's already your password. Choose a new one.",
    })
  })

  it('weak_password pwned', () => {
    const err = new AuthWeakPasswordError('weak', 422, ['pwned'])
    expect(passwordUpdateErrorCopy(err, 'reset').message).toMatch(/data breach/)
  })

  it('weak_password length', () => {
    const err = new AuthWeakPasswordError('weak', 422, ['length'])
    expect(passwordUpdateErrorCopy(err, 'welcome').message).toBe('Use at least 8 characters.')
  })

  it('weak_password characters', () => {
    const err = new AuthWeakPasswordError('weak', 422, ['characters'])
    expect(passwordUpdateErrorCopy(err, 'reset').message).toMatch(/letters, numbers and symbols/)
  })

  it('weak_password other', () => {
    const err = new AuthWeakPasswordError('weak', 422, [])
    expect(passwordUpdateErrorCopy(err, 'reset').message).toBe('Choose a stronger password.')
  })

  it('session gone on reset links to /login', () => {
    const err = new AuthApiError('gone', 401, 'session_expired')
    const copy = passwordUpdateErrorCopy(err, 'reset')
    expect(copy.message).toMatch(/reset link has expired/)
    expect(copy.link).toEqual({ href: '/login', label: 'Sign in' })
  })

  it('session gone on welcome links to /login', () => {
    const err = new AuthApiError('gone', 400, 'reauthentication_needed')
    const copy = passwordUpdateErrorCopy(err, 'welcome')
    expect(copy.message).toMatch(/Forgot password/)
    expect(copy.link?.href).toBe('/login')
  })

  it('rate limit', () => {
    const err = new AuthApiError('slow', 429, 'over_request_rate_limit')
    expect(passwordUpdateErrorCopy(err, 'reset').message).toMatch(/Too many tries/)
  })

  it('network', () => {
    const err = new AuthRetryableFetchError('offline', 0)
    expect(passwordUpdateErrorCopy(err, 'reset').message).toContain(PRODUCT_NAME)
  })

  it('unknown falls back with support email', () => {
    const err = new AuthApiError('weird', 500, 'unexpected_failure')
    expect(passwordUpdateErrorCopy(err, 'reset').message).toContain(SUPPORT_EMAIL)
  })
})

describe('signInErrorCopy', () => {
  it('invalid_credentials on login', () => {
    const err = new AuthApiError('bad', 400, 'invalid_credentials')
    expect(signInErrorCopy(err, 'login')).toBe("That email and password don't match.")
  })

  it('invalid_credentials on invite keeps WRONG_PASSWORD_COPY', () => {
    const err = new AuthApiError('bad', 400, 'invalid_credentials')
    expect(signInErrorCopy(err, 'invite')).toBe(WRONG_PASSWORD_COPY)
  })

  it('email_not_confirmed', () => {
    const err = new AuthApiError('x', 400, 'email_not_confirmed')
    expect(signInErrorCopy(err, 'login')).toMatch(/Confirm your email/)
  })

  it('user_banned', () => {
    const err = new AuthApiError('x', 400, 'user_banned')
    expect(signInErrorCopy(err, 'login')).toContain(SUPPORT_EMAIL)
  })

  it('rate limit', () => {
    const err = new AuthApiError('x', 429, 'over_email_send_rate_limit')
    expect(signInErrorCopy(err, 'login')).toMatch(/Too many tries/)
  })

  it('network', () => {
    const err = new AuthRetryableFetchError('offline', 0)
    expect(signInErrorCopy(err, 'login')).toContain(PRODUCT_NAME)
  })

  it('unknown sign-in fallback', () => {
    expect(signInErrorCopy(new AuthApiError('x', 500, 'nope'), 'login')).toMatch(
      /couldn't sign you in/
    )
  })
})

describe('resetRequestErrorCopy', () => {
  it('returns copy for rate limit and network only', () => {
    expect(
      resetRequestErrorCopy(new AuthApiError('x', 429, 'over_request_rate_limit'))
    ).toMatch(/Too many tries/)
    expect(resetRequestErrorCopy(new AuthRetryableFetchError('offline', 0))).toContain(
      PRODUCT_NAME
    )
  })

  it('returns null for user_not_found-style errors (no enumeration)', () => {
    expect(resetRequestErrorCopy(new AuthApiError('x', 400, 'user_not_found'))).toBeNull()
    expect(resetRequestErrorCopy(new AuthApiError('x', 400, 'invalid_credentials'))).toBeNull()
  })
})

describe('applyWaitlistInsertErrorCopy', () => {
  it('maps 42501 to the while-auth copy', () => {
    expect(applyWaitlistInsertErrorCopy({ code: '42501', message: 'permission denied' })).toBe(
      APPLY_WHILE_AUTH_COPY
    )
  })

  it('returns null for other insert failures', () => {
    expect(applyWaitlistInsertErrorCopy({ code: '23505', message: 'dup' })).toBeNull()
    expect(applyWaitlistInsertErrorCopy({ code: 'PGRST301', message: 'x' })).toBeNull()
  })
})
