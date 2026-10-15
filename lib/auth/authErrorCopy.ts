import {
  isAuthApiError,
  isAuthRetryableFetchError,
  isAuthWeakPasswordError,
} from '@supabase/supabase-js'
import { PRODUCT_NAME } from '@/lib/brand'
import { SUPPORT_EMAIL } from '@/lib/productMaster/support'
import { WRONG_PASSWORD_COPY } from '@/lib/brandInviteCopy'

export type AuthErrorCopy = {
  message: string
  link?: { href: string; label: string }
}

const SESSION_GONE_CODES = new Set([
  'reauthentication_needed',
  'session_not_found',
  'session_expired',
  'refresh_token_not_found',
])

const RATE_LIMIT_CODES = new Set(['over_request_rate_limit', 'over_email_send_rate_limit'])

function authCode(err: unknown): string | null {
  if (isAuthApiError(err) || isAuthWeakPasswordError(err)) {
    return err.code ?? null
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code
    return typeof code === 'string' ? code : null
  }
  return null
}

function authStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status
    return typeof status === 'number' ? status : null
  }
  return null
}

function isRateLimited(err: unknown): boolean {
  const code = authCode(err)
  if (code && RATE_LIMIT_CODES.has(code)) return true
  return authStatus(err) === 429
}

function isSessionGone(err: unknown): boolean {
  const code = authCode(err)
  if (code && SESSION_GONE_CODES.has(code)) return true
  return authStatus(err) === 401
}

function weakPasswordCopy(err: unknown): string | null {
  if (!isAuthWeakPasswordError(err) && authCode(err) !== 'weak_password') return null
  const reasons = isAuthWeakPasswordError(err) ? err.reasons ?? [] : []
  if (reasons.includes('pwned')) {
    return 'That password has appeared in a known data breach. Choose a different one.'
  }
  if (reasons.includes('length')) {
    return 'Use at least 8 characters.'
  }
  if (reasons.includes('characters')) {
    return 'Use a mix of letters, numbers and symbols.'
  }
  return 'Choose a stronger password.'
}

function networkCopy(): string {
  return `We couldn't reach ${PRODUCT_NAME}. Check your connection and try again.`
}

function rateLimitCopy(): string {
  return 'Too many tries. Wait a minute, then try again.'
}

/**
 * Copy for `updateUser({ password })` on welcome and reset flows.
 * Never pass Supabase `error.message` to the UI.
 */
export function passwordUpdateErrorCopy(
  err: unknown,
  context: 'welcome' | 'reset'
): AuthErrorCopy {
  const code = authCode(err)

  if (code === 'same_password') {
    return { message: "That's already your password. Choose a new one." }
  }

  const weak = weakPasswordCopy(err)
  if (weak) return { message: weak }

  if (isSessionGone(err)) {
    if (context === 'reset') {
      return {
        message: 'This reset link has expired. Request a new one on the sign-in page.',
        link: { href: '/login', label: 'Sign in' },
      }
    }
    return {
      message:
        'Your session ended. Use Forgot password on the sign-in page to set your password.',
      link: { href: '/login', label: 'Sign in' },
    }
  }

  if (isRateLimited(err)) return { message: rateLimitCopy() }
  if (isAuthRetryableFetchError(err)) return { message: networkCopy() }

  return {
    message: `We couldn't save that password. Try again, or write to ${SUPPORT_EMAIL}.`,
  }
}

/**
 * Copy for `signInWithPassword`. Invite `invalid_credentials` is handled by the
 * caller with {@link WRONG_PASSWORD_COPY}; this still returns a login-flavored
 * string for that code when `context === 'login'`.
 */
export function signInErrorCopy(err: unknown, context: 'login' | 'invite'): string {
  const code = authCode(err)

  if (code === 'invalid_credentials') {
    return context === 'invite'
      ? WRONG_PASSWORD_COPY
      : "That email and password don't match."
  }
  if (code === 'email_not_confirmed') {
    return 'Confirm your email first. Check your inbox for the link.'
  }
  if (code === 'user_banned') {
    return `This account can't sign in. Write to ${SUPPORT_EMAIL}.`
  }
  if (isRateLimited(err)) return rateLimitCopy()
  if (isAuthRetryableFetchError(err)) return networkCopy()

  return "We couldn't sign you in. Try again in a moment."
}

/**
 * Forgot-password request errors. Returns null for anything that isn't a
 * rate-limit or network failure so the neutral "If an account exists…" message
 * stays (no account enumeration).
 */
export function resetRequestErrorCopy(err: unknown): string | null {
  if (isRateLimited(err)) return rateLimitCopy()
  if (isAuthRetryableFetchError(err)) return networkCopy()
  return null
}

/**
 * Applications insert into `brand_waitlist` as anon only. A leftover portal
 * session makes Postgres return 42501 — never pass that raw message to the UI.
 */
export const APPLY_WHILE_AUTH_COPY =
  'You’re signed in. Sign out to request access — applications are anonymous.'

/**
 * Copy for `brand_waitlist` insert failures on `/apply`.
 * Returns null when the caller should keep the generic fallback.
 */
export function applyWaitlistInsertErrorCopy(err: unknown): string | null {
  const code = authCode(err)
  if (code === '42501') return APPLY_WHILE_AUTH_COPY
  return null
}
