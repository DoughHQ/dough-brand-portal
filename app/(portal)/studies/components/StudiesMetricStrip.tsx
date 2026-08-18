'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { OperatorStudyRow } from '@/lib/studies/types'

function isActive(row: OperatorStudyRow): boolean {
  const s = row.lifecycle_state
  return s === 'active' || s === 'paused' || s === 'scheduled'
}

function isDraft(row: OperatorStudyRow): boolean {
  return row.lifecycle_state === 'draft'
}

export function computeStudyMetrics(rows: OperatorStudyRow[]): {
  active: number
  responses: number
  drafts: number
  avgCompletion: number | null
} {
  let active = 0
  let drafts = 0
  let responses = 0
  let targetSum = 0
  let targetCount = 0

  for (const row of rows) {
    if (isActive(row)) active += 1
    if (isDraft(row)) drafts += 1
    const completed =
      typeof row.completed_claims === 'number' && Number.isFinite(row.completed_claims)
        ? row.completed_claims
        : 0
    responses += completed
    const target =
      typeof row.target_completions === 'number' && row.target_completions > 0
        ? row.target_completions
        : null
    if (target != null) {
      targetSum += Math.min(1, completed / target)
      targetCount += 1
    }
  }

  return {
    active,
    responses,
    drafts,
    avgCompletion:
      targetCount >= 2 ? Math.round((targetSum / targetCount) * 100) : null,
  }
}

const card: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 12,
  padding: '16px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  minHeight: 80,
}

const iconWell: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 18,
  background: 'var(--sage-soft, var(--sage-pale))',
  color: 'var(--sage-dark, var(--sage))',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  fontSize: 14,
  fontWeight: 600,
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div style={card}>
      <div style={iconWell} aria-hidden>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--ink-50)',
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

export default function StudiesMetricStrip({
  rows,
}: {
  rows: OperatorStudyRow[]
}) {
  const m = computeStudyMetrics(rows)
  const showAvg = m.avgCompletion != null
  const cols = showAvg ? 4 : 3

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${showAvg ? 200 : 220}px, 1fr))`,
        gap: 12,
      }}
      data-metric-cols={cols}
    >
      <MetricCard icon="●" label="Active studies" value={String(m.active)} />
      <MetricCard
        icon="≡"
        label="Responses collected"
        value={String(m.responses)}
      />
      {showAvg ? (
        <MetricCard
          icon="↑"
          label="Avg completion"
          value={`${m.avgCompletion}%`}
        />
      ) : null}
      <MetricCard icon="◇" label="Drafts" value={String(m.drafts)} />
    </div>
  )
}
