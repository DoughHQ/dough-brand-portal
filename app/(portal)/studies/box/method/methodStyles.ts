import type { CSSProperties } from 'react'

export const helpStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  lineHeight: 1.45,
  color: 'var(--ink-50)',
  maxWidth: 640,
}

export const warnStyle: CSSProperties = {
  margin: '0 0 12px',
  padding: '10px 12px',
  borderRadius: 'var(--r-sm)',
  background: 'var(--amber-soft, #fbf3e3)',
  border: '1px solid rgba(180, 120, 40, 0.25)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  lineHeight: 1.4,
  color: 'var(--ink-80)',
  maxWidth: 640,
}

export const labelSm: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-50)',
  marginBottom: 6,
}

export const subHelp: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  lineHeight: 1.4,
}

export const inputBase: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function isBattleStep(id: string): boolean {
  return id === 'shelf_battles' || id === 'taste_battles'
}
