'use client'

import type { CSSProperties } from 'react'
import type { CompareGroupMetrics } from '@/lib/compareGroups.shared'
import { relativeTime } from './groupHelpers'

type Props = {
  metrics: CompareGroupMetrics | null
}

function fmtCount(n: number | null | undefined): string {
  if (n == null || n === 0) return '0'
  return n.toLocaleString()
}

export default function MetricsStrip({ metrics }: Props) {
  if (!metrics) {
    return (
      <section style={{ marginBottom: 32 }}>
        <div style={sectionTitle}>Metrics</div>
        <div
          style={{
            padding: '20px 18px',
            borderRadius: 12,
            border: '1px solid var(--ink-10)',
            background: 'var(--cream, #FAF8F3)',
            fontSize: 14,
            color: 'var(--ink-50)',
          }}
        >
          Metrics unavailable right now — group details and nodes are still shown below.
        </div>
      </section>
    )
  }

  const h = metrics.headline
  const cards: { label: string; value: string }[] = [
    { label: 'Total battles', value: fmtCount(h.total_battles) },
    { label: 'Decided battles', value: fmtCount(h.decided_battles) },
    { label: 'Products (battled)', value: fmtCount(h.product_count) },
    { label: 'Respondents', value: fmtCount(h.respondent_count) },
    { label: 'Skip battles', value: fmtCount(h.skip_battles) },
    {
      label: 'Last battle',
      value: h.last_battle_at ? relativeTime(h.last_battle_at) : '—',
    },
  ]

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={sectionTitle}>Metrics</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {cards.map((c) => (
          <div key={c.label} style={cardStyle}>
            <div style={cardLabel}>{c.label}</div>
            <div style={cardValue}>{c.value}</div>
          </div>
        ))}
      </div>
      {metrics.notes?.disclaimer && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--ink-30)',
            lineHeight: 1.5,
            maxWidth: 720,
          }}
        >
          {metrics.notes.disclaimer}
        </p>
      )}
    </section>
  )
}

const sectionTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 12,
}

const cardStyle: CSSProperties = {
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid var(--ink-10)',
  background: 'var(--white)',
}

const cardLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 6,
}

const cardValue: CSSProperties = {
  fontSize: 22,
  fontWeight: 500,
  color: 'var(--ink)',
  fontVariantNumeric: 'tabular-nums',
}
