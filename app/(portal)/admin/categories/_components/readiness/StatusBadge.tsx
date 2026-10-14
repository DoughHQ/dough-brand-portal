import type { ReadinessStatus } from '@/lib/categoryReadiness.shared'
import { STATUS_STYLE } from './statusStyle'

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status as ReadinessStatus]
  if (!style) {
    return (
      <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{status}</span>
    )
  }
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
        padding: '2px 8px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  )
}
