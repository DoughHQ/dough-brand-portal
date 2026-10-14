import type { OperatorStudyRow } from '@/lib/studies/types'

function isActive(row: OperatorStudyRow): boolean {
  const s = row.lifecycle_state
  return s === 'active' || s === 'paused' || s === 'scheduled' || s === 'in_review'
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
