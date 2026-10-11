import 'server-only'

/**
 * Server-only client for the brand_invite edge function.
 *
 * Never log the token, request/response bodies, the portal secret, access tokens,
 * hashed tokens, or emails from this module (or its callers).
 */

export type BrandInviteAction = 'peek' | 'redeem'

export type BrandInviteState =
  | 'valid'
  | 'resume'
  | 'has_account'
  | 'expired'
  | 'used'
  | 'revoked'
  | 'invalid'
  | 'other_brand'
  | 'blocked'
  | 'brand_has_admin'
  | 'unavailable'
  | 'error'

export type BrandInviteResult =
  /** Peek: invite state (brand + email are present for valid / resume / has_account). */
  | { ok: true; state: BrandInviteState; brandName?: string; invitedEmail?: string }
  /** Redeem on the has_account path (caller proved the password). */
  | { ok: true; connected: true }
  /** Redeem on the valid / resume path: one-time magic-link token hash for verifyOtp. */
  | { ok: true; hashedToken: string; verificationType: 'magiclink' }
  | { ok: false; state: BrandInviteState }

export const BRAND_INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

const REQUEST_TIMEOUT_MS = 15_000

const KNOWN_STATES: ReadonlySet<string> = new Set<BrandInviteState>([
  'valid',
  'resume',
  'has_account',
  'expired',
  'used',
  'revoked',
  'invalid',
  'other_brand',
  'blocked',
  'brand_has_admin',
  'unavailable',
  'error',
])

const ERROR_RESULT = { ok: false, state: 'error' } as const

function toKnownState(value: unknown): BrandInviteState {
  return typeof value === 'string' && KNOWN_STATES.has(value)
    ? (value as BrandInviteState)
    : 'error'
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function parsePeek(body: Record<string, unknown>): BrandInviteResult {
  if (body.ok !== true) return { ok: false, state: toKnownState(body.state) }
  const state = toKnownState(body.state)
  if (state === 'error') return { ...ERROR_RESULT }

  if (state === 'valid' || state === 'resume' || state === 'has_account') {
    const brandName = nonEmptyString(body.brand_name)
    const invitedEmail = nonEmptyString(body.invited_email)
    if (!brandName || !invitedEmail) return { ...ERROR_RESULT }
    return { ok: true, state, brandName, invitedEmail }
  }
  return { ok: true, state }
}

function parseRedeem(body: Record<string, unknown>): BrandInviteResult {
  if (body.ok === true) {
    if (body.connected === true) return { ok: true, connected: true }
    const hashedToken = nonEmptyString(body.hashed_token)
    if (hashedToken && body.verification_type === 'magiclink') {
      return { ok: true, hashedToken, verificationType: 'magiclink' }
    }
    return { ...ERROR_RESULT }
  }
  if (body.ok === false) return { ok: false, state: toKnownState(body.state) }
  return { ...ERROR_RESULT }
}

export async function callBrandInvite(
  action: BrandInviteAction,
  token: string,
  opts?: { accessToken?: string }
): Promise<BrandInviteResult> {
  if (typeof token !== 'string' || !BRAND_INVITE_TOKEN_PATTERN.test(token)) {
    return { ok: false, state: 'invalid' }
  }

  const secret = process.env.BRAND_INVITE_PORTAL_SECRET
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!secret || !base || !anonKey) return { ...ERROR_RESULT }

  const payload: Record<string, string> = { action, token }
  if (action === 'redeem' && opts?.accessToken) payload.access_token = opts.accessToken

  let res: Response
  try {
    res = await fetch(`${base}/functions/v1/brand_invite`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'x-brand-invite-secret': secret,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    // Network failure or timeout — never surface the cause (it can embed request details).
    return { ...ERROR_RESULT }
  }

  // 401 (bad portal secret), 400 (invalid_body) and 5xx are edge/infra failures, not invite states.
  if (res.status >= 400) return { ...ERROR_RESULT }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    return { ...ERROR_RESULT }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ...ERROR_RESULT }

  const record = body as Record<string, unknown>
  return action === 'peek' ? parsePeek(record) : parseRedeem(record)
}
