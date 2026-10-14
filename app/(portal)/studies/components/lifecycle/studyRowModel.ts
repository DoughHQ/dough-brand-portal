import type {
  OperatorStudyLifecycleState,
  OperatorStudyRow,
} from '@/lib/studies/types'
import {
  checkoutHref,
  isConceptStudy,
} from '@/lib/checkout/status'

function studyLabel(missionType: string): string {
  if (missionType === 'concept_test') return 'Concept'
  if (missionType === 'product_discovery') return 'Discovery'
  if (missionType === 'verified_purchase') return 'Verified purchase'
  if (missionType === 'brand_challenge') return 'Challenge'
  return 'Study'
}

export function typeBadgeLabel(row: OperatorStudyRow): string {
  if (row.test_type === 'concept') return 'Concept'
  if (row.test_type === 'ihut') return 'iHUT'
  if (!row.mission_type) return 'Study'
  return studyLabel(row.mission_type)
}

export function showTwoSessionIndicator(row: OperatorStudyRow): boolean {
  return row.test_type === 'ihut' && row.session_count === 2
}

export function productMeta(row: OperatorStudyRow): string {
  if (row.test_type === 'concept' || row.mission_type === 'concept_test') {
    return 'Concept field'
  }
  return row.focal_product_name ?? 'Product pending'
}

export function claimProgress(row: OperatorStudyRow): {
  label: string
  ratio: number | null
} {
  const completed =
    typeof row.completed_claims === 'number' && Number.isFinite(row.completed_claims)
      ? row.completed_claims
      : 0
  const target =
    typeof row.target_completions === 'number' && row.target_completions > 0
      ? row.target_completions
      : null
  if (target != null) {
    return {
      label: `${completed} / ${target} participants`,
      ratio: Math.min(1, completed / target),
    }
  }
  if (completed === 0) return { label: 'No responses yet', ratio: null }
  return { label: `${completed} completed`, ratio: null }
}

export function reportHref(row: OperatorStudyRow): string {
  if (row.order_status === 'awaiting_payment' && isConceptStudy(row)) {
    return checkoutHref(row.mission_id)
  }
  if (row.test_type === 'concept' || row.mission_type === 'concept_test') {
    return `/studies/concept/${row.mission_id}/report`
  }
  return `/reports/${row.mission_id}`
}

export function statusPill(state: OperatorStudyLifecycleState): {
  label: string
  color: string
  background: string
} {
  switch (state) {
    case 'expired':
      return {
        label: 'Ended',
        color: 'var(--ink-50)',
        background: 'var(--mist, var(--surface-1))',
      }
    case 'archived':
      return {
        label: 'Archived',
        color: 'var(--ink-30)',
        background: 'var(--surface-1)',
      }
    case 'paused':
      return {
        label: 'Paused',
        color: 'var(--amber, #C07818)',
        background: 'var(--amber-pale, #FBF3E8)',
      }
    case 'scheduled':
      return {
        label: 'Scheduled',
        color: 'var(--ink-50)',
        background: 'var(--surface-1)',
      }
    default:
      return {
        label: 'Active',
        color: 'var(--heading)',
        background: 'var(--sage-soft, var(--sage-pale))',
      }
  }
}

export type StudyListProps = {
  rows: OperatorStudyRow[]
  canOperate: boolean
  canEndStudies: boolean
  busyId: string | null
  pending: boolean
  showBrand: boolean
  onEnd: (row: OperatorStudyRow) => void
  onWithdraw: (row: OperatorStudyRow) => void
}

export { rowOverflow, showRowOverflow } from '@/lib/studies/studyListOverflow'
