import Link from 'next/link'
import { conceptListStatus } from '@/lib/checkout/status'
import { PRODUCT_NAME } from '@/lib/brand'
import type { OperatorStudyRow } from '@/lib/studies/types'
import { statusPill } from './lifecycle/studyRowModel'

export function ActiveExtraBadges({ row }: { row: OperatorStudyRow }) {
  const conceptStatus = conceptListStatus(row)
  const state = row.lifecycle_state
  const showState =
    state === 'paused' || state === 'scheduled' || state === 'in_review'
  if (conceptStatus) {
    if (conceptStatus.href) {
      return (
        <Link
          href={conceptStatus.href}
          className="studies-status-pill"
          style={{
            color: 'var(--heading)',
            background: 'var(--sage-soft)',
            textDecoration: 'none',
          }}
        >
          {conceptStatus.label}
        </Link>
      )
    }
    return (
      <span
        className="studies-status-pill"
        style={{ color: 'var(--ink-50)', background: 'var(--paper)' }}
      >
        {conceptStatus.label}
      </span>
    )
  }
  if (!showState) return null
  if (state === 'in_review') {
    return (
      <span className="studies-status-pill" title={`Awaiting ${PRODUCT_NAME} review`}>
        {`In review: ${PRODUCT_NAME} is checking your wording`}
      </span>
    )
  }
  const pill = statusPill(state)
  return (
    <span
      className="studies-status-pill"
      style={{ color: pill.color, background: pill.background }}
    >
      {pill.label}
    </span>
  )
}
