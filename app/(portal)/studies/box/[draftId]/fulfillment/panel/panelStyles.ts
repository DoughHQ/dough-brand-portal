import { type CSSProperties } from 'react'

export const card: CSSProperties = {
  background: 'var(--paper)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: '20px 22px',
}

export const cardLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-50)',
  marginBottom: 14,
}

export function miniBtn(danger: boolean): CSSProperties {
  return {
    border: danger ? '1px solid var(--red)' : 'none',
    background: danger ? 'var(--paper)' : 'var(--sage)',
    color: danger ? 'var(--red)' : 'var(--on-fill)',
    borderRadius: 'var(--r-sm)',
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }
}

export const shipInput: CSSProperties = {
  height: 36,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 10px',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  width: 160,
}
