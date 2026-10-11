import type { CSSProperties } from 'react'

export const optionalAffordance: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--heading)',
  background: 'var(--sage-soft)',
  borderLeft: '3px solid var(--sage)',
  borderRadius: 'var(--r-sm)',
  padding: '8px 12px',
  margin: '0 0 12px',
  lineHeight: 1.4,
  maxWidth: 560,
}

export const openPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--heading)',
  background: 'var(--sage-soft)',
  border: '1px solid var(--sage)',
  borderRadius: 'var(--cb-radius-pill)',
  padding: '5px 12px',
  margin: '0 0 12px',
}

export const chipRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  margin: '0 0 12px',
  maxWidth: 640,
}

export const summaryChip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-80)',
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-pill)',
  padding: '5px 12px',
}

export const subHelp: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  margin: 0,
  lineHeight: 1.4,
}

export const labelSm: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}

export const inputBase: CSSProperties = {
  boxSizing: 'border-box',
  height: 48,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 16px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--paper)',
  outline: 'none',
}

export const groupHeading: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-50)',
  marginBottom: 8,
}

export const allergyGroup: CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px 14px',
  background: 'var(--paper)',
  border: '1px solid rgba(184, 121, 27, 0.35)',
  borderRadius: 'var(--r-md)',
}

export const allergyHeading: CSSProperties = {
  ...groupHeading,
  color: '#8A5A12',
}

export const panel: CSSProperties = {
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-md)',
  padding: 20,
  background: 'var(--surface-1)',
  maxWidth: 640,
}
