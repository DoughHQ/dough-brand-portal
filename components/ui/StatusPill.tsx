import type { CSSProperties } from 'react'

export type StatusPillStatus = 'ready' | 'gathering' | 'not_started'

const COPY: Record<StatusPillStatus, string> = {
  ready: 'Results ready',
  gathering: 'Gathering responses',
  not_started: 'Not started',
}

const STYLES: Record<StatusPillStatus, CSSProperties> = {
  ready: {
    background: 'var(--sage-soft)',
    color: 'var(--sage-dark)',
  },
  gathering: {
    background: 'var(--amber-soft)',
    color: 'var(--amber)',
  },
  not_started: {
    background: 'var(--mist)',
    color: 'var(--ink-muted)',
  },
}

export function StatusPill({ status }: { status: StatusPillStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 'var(--radius-control)',
        ...STYLES[status],
      }}
    >
      {COPY[status]}
    </span>
  )
}
