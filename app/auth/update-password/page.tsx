'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AuthShell, { AuthInput } from '@/components/auth/AuthShell'
import {
  passwordUpdateErrorCopy,
  type AuthErrorCopy,
} from '@/lib/auth/authErrorCopy'
import { MIN_PASSWORD_LENGTH, validateNewPassword } from '@/lib/auth/passwordRules'

type Status = 'checking' | 'ready' | 'invalid' | 'success'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthErrorCopy | null>(null)

  useEffect(() => {
    let resolved = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        resolved = true
        setStatus('ready')
      }
    })

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        resolved = true
        setStatus('ready')
        return
      }
      setTimeout(() => {
        if (!resolved) setStatus('invalid')
      }, 2000)
    }

    void checkSession()
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the client is recreated each render; read the recovery session once
  }, [])

  const ruleError = validateNewPassword(password, confirm)
  const passwordsMismatch = confirm.length > 0 && password !== confirm
  const canSave = status === 'ready' && ruleError === null && !loading

  async function handleSave() {
    if (!canSave) return
    const validation = validateNewPassword(password, confirm)
    if (validation) {
      setError({ message: validation })
      return
    }
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (updateError) {
      setError(passwordUpdateErrorCopy(updateError, 'reset'))
      setStatus('ready')
      return
    }

    setStatus('success')
    setTimeout(() => {
      router.push('/dashboard')
    }, 1200)
  }

  return (
    <AuthShell>
      {status === 'checking' && (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: 'var(--ink-50)' }}>
          Verifying your reset link…
        </div>
      )}

      {status === 'invalid' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 24,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
                letterSpacing: '-0.02em',
              }}
            >
              Link expired
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
          </div>
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
            }}
          >
            Back to sign in
          </Link>
        </>
      )}

      {status === 'success' && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 400,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            Password updated
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-50)' }}>Taking you to the dashboard…</p>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 24,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
                letterSpacing: '-0.02em',
              }}
            >
              Set a new password
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
              Choose a password for your Brand Intelligence account.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AuthInput
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <AuthInput
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />

            {passwordsMismatch && (
              <div style={{ fontSize: 12, color: 'var(--red)' }}>Passwords do not match.</div>
            )}

            {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
              <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                Use at least {MIN_PASSWORD_LENGTH} characters.
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>
                {error.message}
                {error.link ? (
                  <>
                    {' '}
                    <Link
                      href={error.link.href}
                      style={{ color: 'var(--sage)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {error.link.label}
                    </Link>
                  </>
                ) : null}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                width: '100%',
                padding: '12px',
                background: canSave ? 'var(--sage)' : 'var(--ink-10)',
                color: canSave ? 'white' : 'var(--ink-30)',
                borderRadius: 'var(--r-sm)',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: canSave ? 'pointer' : 'default',
                fontFamily: 'var(--font-sans)',
                marginTop: 4,
              }}
            >
              {loading ? 'Saving…' : 'Save password'}
            </button>
          </div>
        </>
      )}
    </AuthShell>
  )
}
