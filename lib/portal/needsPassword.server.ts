import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * True when the signed-in auth user still has a password-pending marker that
 * matches their current password hash. Fail-open on RPC errors so a transient
 * failure cannot lock portal users out (or bounce welcome ↔ portal forever).
 *
 * Never logs identity or error detail.
 */
export async function portalAccountNeedsPassword(): Promise<boolean> {
  return fetchPortalAccountNeedsPassword()
}

export async function fetchPortalAccountNeedsPassword(
  client?: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<boolean> {
  const supabase = client ?? (await createServerSupabaseClient())
  const { data, error } = await supabase.rpc('portal_account_needs_password')
  if (error) return false
  return data === true
}
