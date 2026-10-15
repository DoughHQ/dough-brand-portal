import Link from 'next/link'
import RowOverflowMenu from '../RowOverflowMenu'
import { ICON_CHECK, StudiesGlyph } from '../studiesIcons'
import { NameBlock, StatusPillView } from './StudyNameBlock'
import {
  packingHref,
  reportHref,
  rowOverflow,
  showRowOverflow,
  type StudyListProps,
} from './studyRowModel'

export function CompletedStudyList({
  rows,
  canOperate,
  canEndStudies,
  busyId,
  pending,
  showBrand,
  onEnd,
  onWithdraw,
}: StudyListProps) {
  return (
    <div className="studies-list">
      {rows.map((row) => {
        const responses =
          typeof row.completed_claims === 'number' && Number.isFinite(row.completed_claims)
            ? row.completed_claims
            : 0
        const state = row.lifecycle_state
        const showState = state === 'expired' || state === 'archived'
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
          <div key={row.mission_id} className="studies-study-row studies-study-row--completed">
            <div className="studies-study-main">
              <div className="studies-study-mark">
                <StudiesGlyph d={ICON_CHECK} size={16} />
              </div>
              <NameBlock
                row={row}
                showBrand={showBrand}
                extraBadges={showState ? <StatusPillView state={state} /> : null}
              />
            </div>
            <div className="studies-study-mid">
              <div className="studies-stat-label">Responses</div>
              <div className="studies-stat-value">{responses}</div>
            </div>
            <div className="studies-study-actions">
              {packHref ? (
                <Link href={packHref} className="studies-row-cta" style={{ opacity: 0.85 }}>
                  Pack &amp; ship →
                </Link>
              ) : null}
              <Link href={reportHref(row)} className="studies-row-cta">
                View results →
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
