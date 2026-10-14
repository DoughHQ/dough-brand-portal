import type { ReadinessRow } from '@/lib/categoryReadiness.shared'

export function fmt(n: number): string {
  return n.toLocaleString()
}

export function RaterProgress({ row }: { row: ReadinessRow }) {
  const threshold = row.raterThreshold
  const pct =
    threshold > 0 ? Math.min(100, (row.distinctRaters / threshold) * 100) : 0
  const fill =
    row.status === 'sellable'
      ? 'var(--sage, #3E6B4A)'
      : row.status === 'approaching'
        ? 'var(--amber, #C07818)'
        : 'var(--ink-30)'

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {fmt(row.distinctRaters)}
        <span style={{ fontWeight: 400, color: 'var(--ink-30)' }}>
          {' '}
          / {fmt(threshold)}
        </span>
      </div>
      <div
        style={{
          marginTop: 5,
          height: 4,
          borderRadius: 99,
          background: 'var(--ink-10)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: fill,
            opacity: row.distinctRaters === 0 ? 0 : 1,
          }}
        />
      </div>
    </div>
  )
}
