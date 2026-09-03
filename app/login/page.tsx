'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase'
import ApplyBrandFlow, { type ApplyStep } from '@/components/auth/ApplyBrandFlow'

type Step = ApplyStep | 'login' | 'forgot'

function parseUrlErrors(): { error: string | null; errorCode: string | null } {
  if (typeof window === 'undefined') return { error: null, errorCode: null }

  const searchParams = new URLSearchParams(window.location.search)
  const hashRaw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const hashParams = new URLSearchParams(hashRaw)

  const error = searchParams.get('error') ?? hashParams.get('error')
  const errorCode = searchParams.get('error_code') ?? hashParams.get('error_code')

  return { error, errorCode }
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>('search')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const { error: urlError, errorCode } = parseUrlErrors()

    if (urlError || errorCode) {
      setStep('login')
      if (errorCode === 'otp_expired' || urlError === 'otp_expired') {
        setError('This reset link has expired or was already used. Request a new one below.')
      } else if (urlError === 'auth_callback_failed') {
        setError(
          'Reset link failed. Open it in the same browser (and Chrome profile) you used to request the reset, or request a new link below.'
        )
      } else {
        setError('Sign-in link failed. Please try again.')
      }
      window.history.replaceState(null, '', window.location.pathname)
    }

    // Safety net: recovery session/hash landed on /login instead of update-password
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.replace('/auth/update-password')
      }
    })

    const hashRaw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    const hashParams = new URLSearchParams(hashRaw)
    if (hashParams.get('type') === 'recovery') {
      window.location.replace('/auth/update-password')
    }

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword.trim(),
    })
    setLoading(false)
    if (signInError) {
      setError('Invalid credentials.')
      return
    }
    window.location.href = '/dashboard'
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) {
      setError('Email is required.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim().toLowerCase(),
      {
        redirectTo: `${appUrl}/auth/callback?next=/auth/update-password`,
      }
    )

    setLoading(false)
    if (resetError) {
      console.error('resetPasswordForEmail error:', resetError)
    }
    setInfo(
      'If an account exists for that email, a reset link is on its way. Open it in this same browser.'
    )
  }

  const shellStyle: CSSProperties = {
    minHeight: '100vh',
    background: 'var(--surface)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: step === 'products' ? 'flex-start' : 'center',
    padding: step === 'products' ? '40px 20px 64px' : '40px 20px',
  }

  const cardStyle: CSSProperties = {
    width: '100%',
    maxWidth: 440,
    background: 'var(--white)',
    border: '1px solid var(--ink-10)',
    borderRadius: 'var(--r-xl)',
    padding: '36px 40px',
  }

  const wideCardStyle: CSSProperties = {
    ...cardStyle,
    maxWidth: 880,
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--ink-10)',
    background: 'var(--surface)',
    fontSize: 13,
    color: 'var(--ink)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  }

  const labelStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--ink-50)',
    marginBottom: 6,
    letterSpacing: '0.04em',
  }

  const primaryBtnStyle = (disabled: boolean): CSSProperties => ({
    width: '100%',
    padding: '12px',
    background: disabled ? 'var(--ink-10)' : 'var(--sage)',
    color: disabled ? 'var(--ink-30)' : 'white',
    borderRadius: 'var(--r-sm)',
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-sans)',
    marginTop: 4,
  })

  const isApplyStep =
    step === 'search' || step === 'products' || step === 'details' || step === 'booking'

  return (
    <div style={shellStyle}>
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 500,
            color: 'var(--sage)',
            letterSpacing: '-0.5px',
          }}
        >
          dough<span style={{ color: 'var(--ink-30)', fontWeight: 400 }}>.</span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginTop: 4,
          }}
        >
          Brand Intelligence
        </div>
      </div>

      {isApplyStep ? (
        <ApplyBrandFlow
          step={step}
          setStep={setStep}
          error={error}
          setError={setError}
          onGoToLogin={() => {
            setStep('login')
            setError(null)
            setInfo(null)
          }}
          styles={{
            cardStyle,
            wideCardStyle,
            inputStyle,
            labelStyle,
            primaryBtnStyle,
          }}
        />
      ) : null}

      {step === 'login' && (
        <div style={cardStyle}>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
              }}
            >
              Sign in
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
              For approved brand partners only.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={labelStyle}>Email</div>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@brand.com"
                autoComplete="email"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>
            <div>
              <div style={labelStyle}>Password</div>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
            )}

            <button onClick={handleLogin} disabled={loading} style={primaryBtnStyle(loading)}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  setStep('forgot')
                  setError(null)
                  setInfo(null)
                  setForgotEmail(loginEmail)
                }}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-30)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Forgot password?
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  setStep('search')
                  setError(null)
                }}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-30)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'forgot' && (
        <div style={cardStyle}>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
              }}
            >
              Reset password
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.6 }}>
              Enter your work email and we will send a link to set a new password.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={labelStyle}>Email</div>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@brand.com"
                autoComplete="email"
                onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
            )}
            {info && (
              <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.5 }}>{info}</div>
            )}

            <button
              onClick={handleForgotPassword}
              disabled={loading}
              style={primaryBtnStyle(loading)}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  setStep('login')
                  setError(null)
                  setInfo(null)
                }}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-30)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, fontSize: 11, color: 'var(--ink-30)', textAlign: 'center' }}>
        godough.co · hello@godough.co
      </div>
    </div>
  )
}
