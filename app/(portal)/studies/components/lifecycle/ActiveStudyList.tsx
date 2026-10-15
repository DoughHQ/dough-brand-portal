import Link from 'next/link'
import { isConceptStudy } from '@/lib/checkout/status'
import { ActiveExtraBadges } from '../ActiveExtraBadges'
import RowOverflowMenu from '../RowOverflowMenu'
import { NameBlock } from './StudyNameBlock'
import {
  claimProgress,
  packingHref,
  reportHref,
  rowOverflow,
  showRowOverflow,
  type StudyListProps,
} from './studyRowModel'

export function ActiveStudyList(props: StudyListProps) {
  const { rows, canOperate, canEndStudies, busyId, pending, showBrand, onEnd, onWithdraw } =
    props
  return (
    <div className="studies-list">
      {rows.map((row) => {
        const progress = claimProgress(row)
        const packHref = packingHref(row)
        const overflow = rowOverflow(row, {
          canOperate,
          canEndStudies,
          busyId,
          pending,
          onEnd,
          onWithdraw,
        })
        return (
          <div key={row.mission_id} className="studies-study-row studies-study-row--active">
            <div className="studies-study-main">
              <NameBlock
                row={row}
                showBrand={showBrand}
                extraBadges={<ActiveExtraBadges row={row} />}
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
              {packHref ? (
                <Link href={packHref} className="studies-row-cta" style={{ opacity: 0.85 }}>
                  Pack &amp; ship →
                </Link>
              ) : null}
              <Link href={reportHref(row)} className="studies-row-cta">
                {row.order_status === 'awaiting_payment' && isConceptStudy(row)
                  ? 'Checkout →'
                  : 'View report →'}
              </Link>
              {showRowOverflow({ canOperate, canEndStudies }, row) ? (
                <RowOverflowMenu actions={overflow} />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
