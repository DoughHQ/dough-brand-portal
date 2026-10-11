'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthInput, AuthPrimaryButton } from '@/components/auth/AuthShell'
import { connectInviteAction, continueInviteAction, type InviteActionResult } from './actions'

const errorStyle = { fontSize: 12, color: 'var(--red)', lineHeight: 1.5 } as const
const linkStyle = {
  fontSize: 13,
  color: 'var(--sage)',
  fontWeight: 500,
  textDecoration: 'none',
} as const

/**
 * Server actions redirect on success. A returned failure either stays on the page (inline
 * message) or means the invite changed under us, so re-peek via refresh to show the right card.
 */
function useInviteFailure() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  function handle(result: InviteActionResult | undefined) {
    if (!result) return
    setError(result.message)
    if (result.state !== 'error' && result.state !== 'wrong_password') router.refresh()
  }

  return { error, setError, handle }
}

export function ContinueInvite({ token, label }: { token: string; label: string }) {
  const [pending, startTransition] = useTransition()
  const { error, setError, handle } = useInviteFailure()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <div style={errorStyle}>{error}</div>}
      <AuthPrimaryButton
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            handle(await continueInviteAction(token))
          })
        }}
      >
        {pending ? 'Continuing…' : label}
      </AuthPrimaryButton>
    </div>
  )
}

export function ConnectInvite({ token, label }: { token: string; label: string }) {
  const [pending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const { error, setError, handle } = useInviteFailure()

  function submit() {
    if (pending) return
    setError(null)
    startTransition(async () => {
      handle(await connectInviteAction(token, password))
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AuthInput
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        autoComplete="current-password"
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <div style={errorStyle}>{error}</div>}
      <AuthPrimaryButton disabled={pending} onClick={submit}>
        {pending ? 'Signing in…' : label}
      </AuthPrimaryButton>
      <div style={{ textAlign: 'center' }}>
        <Link href="/login" style={linkStyle}>
          Forgot your password?
        </Link>
      </div>
    </div>
  )
}

export function InviteSignInLink({ label }: { label: string }) {
  return (
    <Link
      href="/login"
      style={{
        display: 'block',
        width: '100%',
        padding: '12px',
        background: 'var(--sage)',
        color: 'white',
        borderRadius: 'var(--r-sm)',
        fontSize: 13,
        fontWeight: 500,
        textAlign: 'center',
        textDecoration: 'none',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {label}
    </Link>
  )
}