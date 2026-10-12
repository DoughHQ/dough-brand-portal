import Link from 'next/link'
import { conceptListStatus, isConceptStudy } from '@/lib/checkout/status'
import { PRODUCT_NAME } from '@/lib/brand'
import RowOverflowMenu from '../RowOverflowMenu'
import { NameBlock, StatusPillView } from './StudyNameBlock'
import { claimProgress, reportHref, rowOverflow, type StudyListProps } from './studyRowModel'

export function ActiveStudyList({
  rows,
  canOperate,
  busyId,
  pending,
  showBrand,
  onClose,
  onWithdraw,
}: StudyListProps) {
  return (
    <div className="studies-list">
      {rows.map((row) => {
        const progress = claimProgress(row)
        const state = row.lifecycle_state
        const showState =
          state === 'paused' || state === 'scheduled' || state === 'in_review'
        const conceptStatus = conceptListStatus(row)
        const overflow = rowOverflow(row, {
          canOperate,
          busyId,
          pending,
          onClose,
          onWithdraw,
        })

        return (
          <div key={row.mission_id} className="studies-study-row studies-study-row--active">
            <div className="studies-study-main">
              <NameBlock
                row={row}
                showBrand={showBrand}
                extraBadges={
                  conceptStatus ? (
                    conceptStatus.href ? (
                      <Link href={conceptStatus.href} className="studies-status-pill" style={{ color: 'var(--heading)', background: 'var(--sage-soft)', textDecoration: 'none' }}>
                        {conceptStatus.label}
                      </Link>
                    ) : (
                      <span className="studies-status-pill" style={{ color: 'var(--ink-50)', background: 'var(--paper)' }}>
                        {conceptStatus.label}
                      </span>
                    )
                  ) : showState ? (
                    state === 'in_review' ? (
                      <span className="studies-status-pill" title={`Awaiting ${PRODUCT_NAME} review`}>
                        {`In review: ${PRODUCT_NAME} is checking your wording`}
                      </span>
                    ) : (
                      <StatusPillView state={state} />
                    )
                  ) : null
                }
              />
            </div>
            <div className="studies-study-mid">
              <div
                className="studies-progress-label"
                style={{ marginBottom: progress.ratio != null ? 8 : 0 }}
              >
                {progress.label}
              </div>
              {progress.ratio != null ? (
                <div className="studies-progress-track">
                  <div
                    className="studies-progress-fill"
                    style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                  />
                </div>
              ) : null}
            </div>
            <div className="studies-study-actions">
              <Link href={reportHref(row)} className="studies-row-cta">
                {row.order_status === 'awaiting_payment' && isConceptStudy(row)
                  ? 'Checkout →'
                  : 'View report →'}
              </Link>
              {canOperate ? <RowOverflowMenu actions={overflow} /> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
