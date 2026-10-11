import type { Metadata } from 'next'
import AuthShell from '@/components/auth/AuthShell'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { callBrandInvite } from '@/lib/brandInvite.server'
import { describeInviteState } from '@/lib/brandInviteCopy'
import { ConnectInvite, ContinueInvite, InviteSignInLink } from './InviteActions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join on Runoff',
  robots: { index: false, follow: false },
}

/**
 * Opening this page only peeks — it never redeems or consumes the invite.
 * Redeeming happens in the server actions, on an explicit click.
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await callBrandInvite('peek', token)

  const state = 'state' in result ? result.state : 'error'
  const brandName = 'brandName' in result ? result.brandName : undefined
  const invitedEmail = 'invitedEmail' in result ? result.invitedEmail : undefined
  const copy = describeInviteState(state, { brandName, email: invitedEmail })

  let signedInAs: string | null = null
  if (copy.action === 'continue' && invitedEmail) {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const current = user?.email?.trim().toLowerCase() ?? ''
    if (current && current !== invitedEmail.trim().toLowerCase()) {
      signedInAs = current
    }
  }

  return (
    <AuthShell wordmark="Runoff">
      <div style={{ marginBottom: copy.action === 'none' ? 0 : 28 }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 400,
            color: 'var(--ink)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          {copy.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>{copy.body}</p>
      </div>

      {signedInAs && (
        <p
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--ink-50)',
            lineHeight: 1.5,
          }}
        >
          You&apos;re signed in as <strong style={{ color: 'var(--ink)' }}>{signedInAs}</strong>.
          Continuing signs you in as{' '}
          <strong style={{ color: 'var(--ink)' }}>{invitedEmail}</strong> instead.
        </p>
      )}

      {copy.action === 'continue' && (
        <ContinueInvite token={token} label={copy.actionLabel ?? 'Continue'} />
      )}
      {copy.action === 'password' && (
        <ConnectInvite token={token} label={copy.actionLabel ?? 'Sign in and join'} />
      )}
      {copy.action === 'login' && <InviteSignInLink label={copy.actionLabel ?? 'Sign in'} />}

      {copy.smallPrint && (
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: 'var(--ink-50)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          {copy.smallPrint}
        </p>
      )}
    </AuthShell>
  )
}
