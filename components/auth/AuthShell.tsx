'use client'

import type { CSSProperties } from 'react'
import './authShell.css'

export const authInputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid rgba(28, 38, 32, 0.14)',
  background: 'var(--white)',
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
  return (
    <div>
      <div style={authLabelStyle}>{label}</div>
      <input
        type={type}
        className="auth-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
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
}: {
  children: React.ReactNode
  wide?: boolean
  align?: 'center' | 'start'
}) {
  return (
    <div className={`auth-shell${align === 'start' ? ' auth-shell--start' : ''}`}>
      <div className="auth-shell__brand">
        <div className="auth-shell__mark" aria-hidden>
          {/* App icon mark — rolling-pin D on sage */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dough-mark.png" alt="" width={72} height={72} />
        </div>
        <div className="auth-shell__wordmark">Dough</div>
      </div>

      <div className={`auth-shell__panel${wide ? ' auth-shell__panel--wide' : ''}`}>
        {children}
      </div>

      <div className="auth-shell__footer">
        <a href="https://godough.co/brands" style={{ color: 'inherit', textDecoration: 'none' }}>
          godough.co/brands
        </a>
        {' · '}
        hello@godough.co
      </div>
    </div>
  )
}
