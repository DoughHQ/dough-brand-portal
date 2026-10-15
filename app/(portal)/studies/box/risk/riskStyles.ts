import type { CSSProperties } from 'react'

export const riskQuestion: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  margin: '0 0 8px',
}

export const riskHelp: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--ink-50)',
  lineHeight: 1.4,
  margin: '4px 0 0',
}

export const riskCard: CSSProperties = {
  padding: '14px 16px',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-md)',
  background: 'var(--paper)',
  maxWidth: 640,
  marginTop: 14,
}
