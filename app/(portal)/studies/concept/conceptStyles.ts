/** Shared inline styles for the concept study operator console. */

import type { CSSProperties } from 'react'
import type { BattleIntent } from '@/lib/concept/types'

/** Page shell — prefer wrapping with className="concept-builder" + CSS. */
export const pageShell: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  maxWidth: 1160,
  margin: '0 auto',
  padding: '28px 28px 120px',
  color: 'var(--ink)',
}

export const sectionCard: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: 32,
  marginBottom: 24,
  boxShadow: 'var(--cb-shadow-card)',
}

export const sectionEyebrow: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--ink-50)',
  marginBottom: 8,
}

export const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  margin: '0 0 8px',
  color: 'var(--ink-80)',
}

export const sectionHelp: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}

export const inputBase: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 48,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 16px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
}

export const selectBase: CSSProperties = {
  ...inputBase,
  appearance: 'none' as const,
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2365736A' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  paddingRight: 40,
}

export const labelSm: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}

export const ghostLink: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--sage)',
  padding: '8px 0',
}

export const trashBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--ink-50)',
  padding: 4,
  lineHeight: 1,
  flexShrink: 0,
}

export const columnHeader: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--ink-80)',
  marginBottom: 2,
}

export const columnMeta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-30)',
}

export function intentTagStyle(intent: BattleIntent): CSSProperties {
  if (intent === 'own_concept_arm') {
    return {
      display: 'inline-block',
      fontFamily: 'var(--font-sans)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--sage)',
      background: 'var(--sage-soft)',
      borderRadius: 'var(--cb-radius-pill)',
      padding: '3px 7px',
    }
  }
  if (intent === 'jtbd_incumbent') {
    return {
      display: 'inline-block',
      fontFamily: 'var(--font-sans)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--amber)',
      background: 'var(--amber-pale)',
      borderRadius: 'var(--cb-radius-pill)',
      padding: '3px 7px',
    }
  }
  return {
    display: 'inline-block',
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--ink-80)',
    background: 'var(--surface-1)',
    borderRadius: 'var(--cb-radius-pill)',
    padding: '3px 7px',
  }
}

/** Base field card — shared by concept arms and competitors; both columns read larger. */
export const fieldCard: CSSProperties = {
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: 24,
  background: 'var(--white)',
  marginBottom: 12,
  boxShadow: 'none',
  cursor: 'grab',
}

/** Competitor product image — the real image when we have one. */
export const competitorThumb: CSSProperties = {
  width: '100%',
  height: 140,
  objectFit: 'contain',
  display: 'block',
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-media)',
}

/** Default shown when a competitor has no image yet. */
export const competitorThumbPlaceholder: CSSProperties = {
  width: '100%',
  height: 140,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '0 12px',
  background: 'var(--surface-1)',
  border: 'var(--cb-border-dashed)',
  borderRadius: 'var(--cb-radius-media)',
  color: 'var(--ink-30)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

export const stageCard: CSSProperties = {
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-md)',
  padding: '16px 18px',
  background: 'var(--cream)',
  marginBottom: 12,
}

export const stageLocked: CSSProperties = {
  ...stageCard,
  borderColor: 'rgba(192, 120, 24, 0.45)',
  background: 'var(--cb-surface-muted)',
  boxShadow: 'inset 3px 0 0 var(--amber)',
}
