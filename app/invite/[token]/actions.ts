'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  callBrandInvite,
  type BrandInviteResult,
  type BrandInviteState,
} from '@/lib/brandInvite.server'
import {
  describeInviteState,
  GENERIC_INVITE_ERROR_COPY,
  WRONG_PASSWORD_COPY,
} from '@/lib/brandInviteCopy'

/**
 * Failure shape returned to the invite client. Success never returns: it redirects
 * (hardcoded destinations only — these actions never accept a `next` target).
 *
 * Never log the token, hashed token, password, access token, or email here.
 */
export type InviteActionResult = {
  ok: false
  state: BrandInviteState | 'wrong_password'
  message: string
}

function failureFrom(result: BrandInviteResult): InviteActionResult {
  const state = 'state' in result ? result.state : 'error'
  const copy = describeInviteState(state, {})
  return { ok: false, state, message: copy.body || GENERIC_INVITE_ERROR_COPY }
}

/**
 * valid / resume: redeem (no access token), then trade the one-time magic-link hash for a
 * session and send the new account to pick a password.
 */
export async function continueInviteAction(token: string): Promise<InviteActionResult> {
  const result = await callBrandInvite('redeem', token)
  if (!result.ok || !('hashedToken' in result)) return failureFrom(result)

  const supabase = await createServerSupabaseClient()

  // A stale session for another account would otherwise survive (or win over) the invite session.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.auth.signOut({ scope: 'local' })
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: result.hashedToken,
    type: 'magiclink',
  })
  if (error) {
    // The invite is already redeemed; a retry lands on the `resume` state with a fresh link.
    return { ok: false, state: 'error', message: GENERIC_INVITE_ERROR_COPY }
  }

  redirect('/welcome/password')
}

/**
 * has_account: the visitor proves they own the existing account with its password, then the
 * invite is redeemed against that session. Never uses verifyOtp.
 */
export async function connectInviteAction(
  token: string,
  password: string
): Promise<InviteActionResult> {
  const trimmed = typeof password === 'string' ? password.trim() : ''
  if (!trimmed) {
    return { ok: false, state: 'wrong_password', message: 'Enter your password.' }
  }

  // The email comes from the invite, never from the client.
  const peek = await callBrandInvite('peek', token)
  if (!peek.ok || !('state' in peek) || peek.state !== 'has_account' || !peek.invitedEmail) {
    return failureFrom(peek)
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user: existing },
  } = await supabase.auth.getUser()
  if (existing) {
    await supabase.auth.signOut({ scope: 'local' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: peek.invitedEmail.trim().toLowerCase(),
    password: trimmed,
  })
  if (error) {
    return { ok: false, state: 'wrong_password', message: WRONG_PASSWORD_COPY }
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    return { ok: false, state: 'error', message: GENERIC_INVITE_ERROR_COPY }
  }

  const redeemed = await callBrandInvite('redeem', token, { accessToken })
  if (!redeemed.ok || !('connected' in redeemed)) return failureFrom(redeemed)

  redirect('/dashboard?welcome=1')
}
