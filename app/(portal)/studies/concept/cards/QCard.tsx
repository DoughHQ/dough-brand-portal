import type { ReactNode } from 'react'

export function QCard({
  id,
  title,
  help,
  locked,
  lockLabel,
  children,
}: {
  id?: string
  title: string
  help: string
  locked?: boolean
  lockLabel?: string
  children?: ReactNode
}) {
  return (
    <div
      id={id}
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: '20px 20px 18px',
        marginBottom: 14,
        background: locked ? 'var(--surface-1)' : 'var(--paper)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: locked ? 'var(--ink-50)' : 'var(--ink-80)',
          }}
        >
          {title}
        </h3>
        {locked ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--ink-30)',
            }}
          >
            {lockLabel ?? 'SYSTEM-MANAGED'}
          </span>
        ) : null}
      </div>
      <p
        style={{
          margin: locked ? '0' : '0 0 16px',
          fontSize: 13,
          color: 'var(--ink-50)',
          lineHeight: 1.45,
        }}
      >
        {help}
      </p>
      {children}
    </div>
  )
}
