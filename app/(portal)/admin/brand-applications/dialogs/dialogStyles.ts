import type { CSSProperties } from 'react'

export const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28, 38, 32, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 80,
  padding: 24,
}

export const panelStyle: CSSProperties = {
  background: 'var(--paper)',
  borderRadius: 12,
  border: '1px solid var(--ink-10)',
  maxWidth: 480,
  width: '100%',
  padding: '22px 24px',
  boxShadow: '0 12px 40px rgba(28, 38, 32, 0.18)',
}

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 6,
}

export const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink)',
  outline: 'none',
}
