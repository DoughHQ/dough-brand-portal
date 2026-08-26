'use client'

import type { ReactNode } from 'react'
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

function Glyph({ d }: { d: string | string[] }) {
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      {paths.map((path) => (
        <path
          key={path}
          d={path}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
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
    <div className="studies-metric-card">
      <div className="studies-metric-icon" aria-hidden>
        {icon}
      </div>
      <div className="studies-metric-copy">
        <div className="studies-metric-label">{label}</div>
        <div className="studies-metric-value">{value}</div>
      </div>
    </div>
  )
}

export default function StudiesMetricStrip({
  rows,
  draftCount,
  completedCount,
}: {
  rows: OperatorStudyRow[]
  /** Wizard drafts from list_study_drafts — not mission lifecycle_state === 'draft'. */
  draftCount: number
  /** Same collection as the Completed section. */
  completedCount: number
}) {
  const m = computeStudyMetrics(rows)

  return (
    <div className="studies-metric-strip">
      <MetricCard
        icon={
          <Glyph
            d={[
              'M10 2v7.5L4.2 19.2A2 2 0 0 0 5.9 22h12.2a2 2 0 0 0 1.7-2.8L14 9.5V2',
              'M8.5 2h7',
              'M7 14h10',
            ]}
          />
        }
        label="Active studies"
        value={String(m.active)}
      />
      <MetricCard
        icon={
          <Glyph
            d={[
              'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
              'M14 3v5h5',
            ]}
          />
        }
        label="Drafts"
        value={String(draftCount)}
      />
      <MetricCard
        icon={
          <Glyph d={['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3']} />
        }
        label="Completed"
        value={String(completedCount)}
      />
      <MetricCard
        icon={
          <Glyph
            d={[
              'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
              'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
              'M22 21v-2a4 4 0 0 0-3-3.87',
              'M16 3.13a4 4 0 0 1 0 7.75',
            ]}
          />
        }
        label="Responses collected"
        value={String(m.responses)}
      />
    </div>
  )
}
