import type { ReadinessStatus } from '@/lib/categoryReadiness.shared'
import { STATUS_STYLE } from './statusStyle'

export function ReadinessStatusStrip({
  statusCounts,
}: {
  statusCounts: Record<ReadinessStatus, number>
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {(
        [
          ['sellable', 'Sellable'],
          ['approaching', 'Approaching'],
          ['building', 'Building'],
          ['empty', 'Empty'],
        ] as const
      ).map(([key, label]) => (
        <div
          key={key}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--ink-10)',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: STATUS_STYLE[key].color,
              marginBottom: 6,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 400,
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {statusCounts[key]}
          </div>
        </div>
      ))}
    </div>
  )
}
