'use client'

import { useState, type CSSProperties } from 'react'
import { MARKETING_ORIGIN, PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/brand'
import './authShell.css'

export const authInputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid rgba(28, 38, 32, 0.14)',
  background: 'var(--paper)',
  fontSize: 16,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'border-color 0.12s, box-shadow 0.12s',
}

export const authLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 6,
  letterSpacing: '0.04em',
}

export const authCardStyle: CSSProperties = {
  width: '100%',
}

export function authPrimaryBtnStyle(disabled: boolean): CSSProperties {
  return {
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
    transition: 'background 0.12s',
    marginTop: 4,
  }
}

function PasswordEyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-.5 1.2-1.2 2.3-2.1 3.2M6.1 6.1C4.2 7.4 2.7 9.2 2 12c1.7 3.9 6 7 10 7 1.4 0 2.8-.3 4-.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  onKeyDown,
  autoComplete,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (visible ? 'text' : 'password') : type

  return (
    <div>
      <div style={authLabelStyle}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          className="auth-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
          style={{
            ...authInputStyle,
            ...(isPassword ? { paddingRight: 48 } : null),
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--sage)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
            e.target.style.boxShadow = 'none'
          }}
        />
        {isPassword ? (
          <button
            type="button"
            className="auth-password-toggle"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              padding: 0,
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--ink-50)',
              cursor: 'pointer',
            }}
          >
            <PasswordEyeIcon open={visible} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function AuthPrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={authPrimaryBtnStyle(!!disabled)}>
      {children}
    </button>
  )
}

export function AuthTextButton({
  children,
  onClick,
  muted = false,
}: {
  children: React.ReactNode
  onClick: () => void
  muted?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 13,
        color: muted ? 'var(--ink-50)' : 'var(--sage)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  )
}

export default function AuthShell({
  children,
  wide = false,
  align = 'center',
  wordmark = PRODUCT_NAME,
}: {
  children: React.ReactNode
  wide?: boolean
  align?: 'center' | 'start'
  /** Display name under the mark. Defaults to PRODUCT_NAME. */
  wordmark?: string
}) {
  const marketingHost = MARKETING_ORIGIN.replace(/^https?:\/\//, '')
  return (
    <div className={`auth-shell${align === 'start' ? ' auth-shell--start' : ''}`}>
      <div className="auth-shell__brand">
        <div className="auth-shell__mark" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/runoff-app-icon-256.png" alt="" width={72} height={72} />
        </div>
        <div className="auth-shell__wordmark">{wordmark}</div>
      </div>

      <div className={`auth-shell__panel${wide ? ' auth-shell__panel--wide' : ''}`}>
        {children}
      </div>

      <div className="auth-shell__footer">
        <a href={MARKETING_ORIGIN} style={{ color: 'inherit', textDecoration: 'none' }}>
          {marketingHost}
        </a>
        {' · '}
        {SUPPORT_EMAIL}
      </div>
    </div>
  )
}
