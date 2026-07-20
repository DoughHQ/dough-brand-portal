import type { CSSProperties } from 'react'

/** Master product page — type floor 13px; layout fills the portal canvas. */

export const pageShell: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  maxWidth: 1200,
  margin: '0 auto',
  padding: '28px 32px 96px',
  color: 'var(--ink)',
  width: '100%',
  boxSizing: 'border-box',
}

export const card: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 12,
  padding: '28px 32px',
}

export const productName: CSSProperties = {
  fontFamily: 'var(--font-serif, var(--font-display))',
  fontSize: 36,
  fontWeight: 400,
  lineHeight: 1.12,
  letterSpacing: '-0.02em',
  color: 'var(--ink)',
  margin: 0,
}

export const sectionHeading: CSSProperties = {
  fontFamily: 'var(--font-serif, var(--font-display))',
  fontSize: 20,
  fontWeight: 400,
  lineHeight: 1.3,
  color: 'var(--ink)',
  margin: '0 0 16px',
}

export const consumerQuestion: CSSProperties = {
  fontFamily: 'var(--font-serif, var(--font-display))',
  fontSize: 17,
  fontWeight: 400,
  fontStyle: 'normal',
  lineHeight: 1.45,
  color: 'var(--ink)',
  margin: 0,
}

export const bodyText: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 400,
  lineHeight: 1.6,
  color: 'var(--ink)',
}

export const fieldLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 400,
  lineHeight: 1.5,
  color: 'var(--ink-muted, rgba(28,38,32,0.55))',
}

export const fieldValue: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 400,
  lineHeight: 1.5,
  color: 'var(--ink)',
}

export const fieldEmpty: CSSProperties = {
  ...fieldValue,
  color: 'var(--ink-faint, rgba(28,38,32,0.38))',
}

export const metricNumber: CSSProperties = {
  fontFamily: 'var(--font-serif, var(--font-display))',
  fontSize: 28,
  fontWeight: 400,
  lineHeight: 1,
  color: 'var(--ink)',
}

export const caption: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.5,
  color: 'var(--ink-muted, rgba(28,38,32,0.55))',
}

export const chip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.5,
  padding: '3px 9px',
  borderRadius: 6,
  whiteSpace: 'nowrap',
}

export const button: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 500,
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  background: 'var(--white)',
  color: 'var(--ink)',
  cursor: 'pointer',
}

export const buttonPrimary: CSSProperties = {
  ...button,
  background: 'var(--sage)',
  borderColor: 'var(--sage)',
  color: '#fff',
}

export const hairline: CSSProperties = {
  border: 0,
  borderTop: '1px solid var(--ink-10, rgba(28,38,32,0.1))',
  margin: '28px 0',
  padding: 0,
}

export const sectionBlock: CSSProperties = {
  paddingTop: 4,
  marginBottom: 8,
}

export const fieldGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(140px, 180px) minmax(0, 1fr)',
  gap: '14px 24px',
  alignItems: 'baseline',
}

export const twoCol: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
  gap: 20,
  alignItems: 'start',
}

export const metricCard: CSSProperties = {
  padding: '16px 18px',
  borderRadius: 8,
  background: 'var(--surface-1, #f4f2eb)',
  border: '1px solid transparent',
}

export const questionCard: CSSProperties = {
  padding: '16px 18px',
  borderRadius: 8,
  border: '1px solid var(--ink-10)',
  background: 'var(--cream, #faf8f3)',
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 15,
  fontFamily: 'var(--font-sans)',
  lineHeight: 1.5,
  color: 'var(--ink)',
  boxSizing: 'border-box',
  background: 'var(--white)',
}

export const panel: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 12,
  padding: '24px 26px',
}

/** Pending correction chrome — soft amber edge so the field is obvious. */
export const panelPending: CSSProperties = {
  ...panel,
  borderColor: 'rgba(192,120,24,0.45)',
  boxShadow: 'inset 3px 0 0 var(--amber, #c07818)',
  background: 'var(--amber-soft, rgba(192,120,24,0.04))',
}
