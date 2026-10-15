import Link from 'next/link'
import {
  AuthInput,
  authInputStyle,
  authLabelStyle,
  authPrimaryBtnStyle,
} from '@/components/auth/AuthShell'
import { PRODUCT_NAME } from '@/lib/brand'
import type { LoginState } from './useLogin'

export function SignInStep({
  loading,
  error,
  setError,
  setInfo,
  setStep,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  setForgotEmail,
  handleLogin,
}: Pick<
  LoginState,
  | 'loading'
  | 'error'
  | 'setError'
  | 'setInfo'
  | 'setStep'
  | 'loginEmail'
  | 'setLoginEmail'
  | 'loginPassword'
  | 'setLoginPassword'
  | 'setForgotEmail'
  | 'handleLogin'
>) {
  return (
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
          Sign in
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          For approved brand partners only.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={authLabelStyle}>Email</div>
          <input
            type="email"
            className="auth-input"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="you@brand.com"
            autoComplete="email"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={authInputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
        <AuthInput
          label="Password"
          type="password"
          value={loginPassword}
          onChange={setLoginPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
        )}

        <button onClick={handleLogin} disabled={loading} style={authPrimaryBtnStyle(loading)}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => {
              setStep('forgot')
              setError(null)
              setInfo(null)
              setForgotEmail(loginEmail)
            }}
            style={{
              fontSize: 13,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            Forgot password?
          </button>
          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-50)',
              fontFamily: 'var(--font-sans)',
              margin: 0,
            }}
          >
            New to {PRODUCT_NAME}?{' '}
            <Link
              href="/apply"
              style={{ color: 'var(--sage)', fontWeight: 600, textDecoration: 'none' }}
            >
              Request access
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
