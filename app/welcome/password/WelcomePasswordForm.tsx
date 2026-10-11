'use client'

import { useState, useTransition } from 'react'
import { AuthInput, AuthPrimaryButton } from '@/components/auth/AuthShell'
import { MIN_PASSWORD_LENGTH, validateNewPassword } from '@/lib/auth/passwordRules'
import { setWelcomePasswordAction } from './actions'

export default function WelcomePasswordForm({ email }: { email: string }) {
  const [pending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const ruleError = validateNewPassword(password, confirm)
  const canSave = !pending && password.length > 0 && confirm.length > 0 && ruleError === null

  function submit() {
    const message = validateNewPassword(password, confirm)
    if (message) {
      setError(message)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await setWelcomePasswordAction(password, confirm)
      if (result) setError(result.error)
    })
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
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
          Set your password
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          You&apos;ll use it with <strong style={{ color: 'var(--ink)' }}>{email || 'your email'}</strong>{' '}
          to sign in to Runoff. At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <AuthInput
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
        )}
        <AuthPrimaryButton disabled={!canSave} onClick={submit}>
          {pending ? 'Saving…' : 'Save and continue'}
        </AuthPrimaryButton>
      </div>
    </>
  )
}
