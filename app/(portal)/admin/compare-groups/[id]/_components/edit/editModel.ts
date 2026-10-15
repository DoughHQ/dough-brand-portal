export const TYPES = ['primary', 'alternative', 'benchmark', 'display'] as const
export const STATUSES = ['active', 'deprecated'] as const

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 14,
}

export const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink)',
  background: 'var(--paper)',
  boxSizing: 'border-box',
}
