'use client'

import type { OperatorStudyRow } from '@/lib/studies/types'
import { computeStudyMetrics } from './metrics/computeStudyMetrics'
import StudiesMetricCards from './metrics/StudiesMetricCards'

export { computeStudyMetrics }

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
    <StudiesMetricCards
      active={m.active}
      draftCount={draftCount}
      completedCount={completedCount}
      responses={m.responses}
    />
  )
}
