'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { validateNewPassword } from '@/lib/auth/passwordRules'
import { fetchPortalAccountNeedsPassword } from '@/lib/portal/needsPassword.server'

export type SetWelcomePasswordResult = { ok: false; error: string }

/**
 * Changing the password is what clears the invite's needs-a-password marker (the marker is
 * tied to the password fingerprint), so there is no separate "clear" call. Success redirects
 * to a hardcoded destination. Never log the password.
 */
export async function setWelcomePasswordAction(
  password: string,
  confirm: string
): Promise<SetWelcomePasswordResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser) redirect('/login')

  if (!(await fetchPortalAccountNeedsPassword())) redirect('/dashboard')

  const ruleError = validateNewPassword(password, confirm)
  if (ruleError) return { ok: false, error: ruleError }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    const msg = (error.message ?? '').toLowerCase()
    if (msg.includes('weak_password') || msg.includes('weak')) {
      return {
        ok: false,
        error: error.message || 'That password is too weak. Try a longer one.',
      }
    }
    if (msg.includes('reauth') || msg.includes('reauthentication')) {
      return {
        ok: false,
        error:
          'For your security, request a fresh link: use Forgot password on the sign-in page.',
      }
    }
    return { ok: false, error: "We couldn't save that password. Try a different one." }
  }

  redirect('/dashboard?welcome=1')
}
