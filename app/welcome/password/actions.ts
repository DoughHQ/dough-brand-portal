'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { validateNewPassword } from '@/lib/auth/passwordRules'
import { passwordUpdateErrorCopy } from '@/lib/auth/authErrorCopy'
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
    return { ok: false, error: passwordUpdateErrorCopy(error, 'welcome').message }
  }

  redirect('/dashboard?welcome=1')
}
