import type { ReactNode } from 'react'

export function DecisionBadge({
  tone,
  children,
}: {
  tone: 'sage' | 'amber' | 'ink'
  children: ReactNode
}) {
  const styles =
    tone === 'amber'
      ? {
          background: 'var(--amber-pale, rgba(192,120,24,0.12))',
          color: 'var(--amber, #a66a14)',
          border: '1px solid rgba(192,120,24,0.28)',
        }
      : tone === 'sage'
        ? {
            background: 'var(--sage-soft)',
            color: 'var(--heading)',
            border: '1px solid rgba(62,107,74,0.22)',
          }
        : {
            background: 'var(--surface-1)',
            color: 'var(--ink-50)',
            border: '1px solid var(--ink-10)',
          }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: '4px 9px',
        borderRadius: 999,
        ...styles,
      }}
    >
      {children}
    </span>
  )
}
