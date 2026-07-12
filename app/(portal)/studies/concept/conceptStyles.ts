/** Shared inline styles for the concept study operator console. */

import type { CSSProperties } from 'react'
import type { BattleIntent } from '@/lib/concept/types'

export const pageShell: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  maxWidth: 1080,
  margin: '0 auto',
  padding: '28px 28px 120px',
  color: 'var(--ink)',
}

export const sectionCard: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: '28px 28px 24px',
  marginBottom: 20,
}

export const sectionEyebrow: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 6,
}

export const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  margin: '0 0 6px',
  color: 'var(--ink)',
}

export const sectionHelp: CSSProperties = {
  fontSize: 13,
  color: 'var(--ink-50)',
  margin: '0 0 22px',
  lineHeight: 1.45,
}

export const inputBase: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '9px 11px',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
}

export const selectBase: CSSProperties = {
  ...inputBase,
  appearance: 'none' as const,
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237a847c' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
}

export const labelSm: CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 5,
}

export const ghostLink: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--sage)',
  padding: '6px 0',
}

export const trashBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: 'var(--ink-30)',
  padding: 4,
  lineHeight: 1,
  flexShrink: 0,
}

export function intentTagStyle(intent: BattleIntent): CSSProperties {
  if (intent === 'own_concept_arm') {
    return {
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--sage)',
      background: 'var(--sage-soft)',
      borderRadius: 4,
      padding: '3px 7px',
    }
  }
  if (intent === 'jtbd_incumbent') {
    return {
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--amber)',
      background: 'var(--amber-pale)',
      borderRadius: 4,
      padding: '3px 7px',
    }
  }
  return {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--ink-80)',
    background: 'var(--surface-1)',
    borderRadius: 4,
    padding: '3px 7px',
  }
}

export const competitorCard: CSSProperties = {
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-md)',
  padding: '14px 14px 12px',
  background: 'var(--cream)',
  marginBottom: 10,
  cursor: 'grab',
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
  background: 'linear-gradient(180deg, #fffdf8 0%, var(--cream) 100%)',
  boxShadow: 'inset 3px 0 0 var(--amber)',
}
