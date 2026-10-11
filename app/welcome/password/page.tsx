import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { fetchPortalAccountNeedsPassword } from '@/lib/portal/needsPassword.server'
import WelcomePasswordForm from './WelcomePasswordForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Set your password — Runoff',
  robots: { index: false, follow: false },
}

/**
 * Gate: signed in with an active membership AND the account still needs a password.
 * Anyone else is sent on (signed out / no membership → login, already set → dashboard).
 */
export default async function WelcomePasswordPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser) redirect('/login')

  if (!(await fetchPortalAccountNeedsPassword())) redirect('/dashboard')

  return (
    <AuthShell wordmark="Runoff">
      <WelcomePasswordForm email={user.email ?? ''} />
    </AuthShell>
  )
}
