import type { ReactNode } from 'react'

export const DECK_WIDTH = 920

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'pro' | 'amber'
}) {
  const colors =
    tone === 'pro'
      ? { color: 'var(--text-pro)', background: 'var(--bg-pro)' }
      : tone === 'amber'
        ? { color: 'var(--amber)', background: 'var(--amber-soft)' }
        : { color: 'var(--ink-muted)', background: 'var(--surface-1)' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 4,
        ...colors,
      }}
    >
      {children}
    </span>
  )
}
