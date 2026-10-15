import {
  authInputStyle,
  authLabelStyle,
  authPrimaryBtnStyle,
} from '@/components/auth/AuthShell'
import type { LoginState } from './useLogin'

export function ForgotStep({
  loading,
  error,
  setError,
  info,
  setInfo,
  setStep,
  forgotEmail,
  setForgotEmail,
  handleForgotPassword,
}: Pick<
  LoginState,
  | 'loading'
  | 'error'
  | 'setError'
  | 'info'
  | 'setInfo'
  | 'setStep'
  | 'forgotEmail'
  | 'setForgotEmail'
  | 'handleForgotPassword'
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
          Reset password
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          Enter your work email and we will send a link to set a new password.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={authLabelStyle}>Email</div>
          <input
            type="email"
            className="auth-input"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="you@brand.com"
            autoComplete="email"
            onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
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

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
        )}
        {info && (
          <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.5 }}>{info}</div>
        )}

        <button
          onClick={handleForgotPassword}
          disabled={loading}
          style={authPrimaryBtnStyle(loading)}
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
              fontSize: 13,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </>
  )
}
