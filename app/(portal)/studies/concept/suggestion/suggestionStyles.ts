import type { CSSProperties } from 'react'

export const panelStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 20,
  left: 0,
  right: 0,
  top: '100%',
  marginTop: 4,
  padding: 0,
  listStyle: 'none',
  background: 'var(--paper)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-card)',
  boxShadow: 'var(--cb-shadow-popover)',
  maxHeight: 220,
  overflowY: 'auto',
}

export const rowStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  borderBottom: '1px solid var(--cb-border-soft)',
  background: 'transparent',
  padding: 12,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--ink)',
}

export const mutedRow: CSSProperties = {
  padding: 12,
  fontSize: 12,
  color: 'var(--ink-50)',
}
