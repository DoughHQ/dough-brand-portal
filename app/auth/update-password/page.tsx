'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AuthShell from '@/components/auth/AuthShell'

type Status = 'checking' | 'ready' | 'invalid' | 'success'

const MIN_PASSWORD_LENGTH = 8

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const passwordsMatch = confirm.length > 0 && password === confirm
  const passwordsMismatch = confirm.length > 0 && password !== confirm
  const canSave =
    status === 'ready' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    passwordsMatch &&
    !loading

  async function handleSave() {
    if (!canSave) return
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      setStatus('ready')
      return
    }

    setStatus('success')
    setTimeout(() => {
      window.location.href = '/dashboard'
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
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--ink-50)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                }}
              >
                New password
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--ink-10)',
                  background: 'var(--white)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--sage)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--ink-50)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                }}
              >
                Confirm password
              </div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--ink-10)',
                  background: 'var(--white)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--sage)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            {passwordsMismatch && (
              <div style={{ fontSize: 12, color: 'var(--red)' }}>Passwords do not match.</div>
            )}

            {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
              <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                Use at least {MIN_PASSWORD_LENGTH} characters.
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
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
