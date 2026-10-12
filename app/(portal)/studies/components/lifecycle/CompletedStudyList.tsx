import Link from 'next/link'
import RowOverflowMenu from '../RowOverflowMenu'
import { ICON_CHECK, StudiesGlyph } from '../studiesIcons'
import { NameBlock, StatusPillView } from './StudyNameBlock'
import { reportHref, rowOverflow, type StudyListProps } from './studyRowModel'

export function CompletedStudyList({
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
        const responses =
          typeof row.completed_claims === 'number' && Number.isFinite(row.completed_claims)
            ? row.completed_claims
            : 0
        const state = row.lifecycle_state
        const showState = state === 'expired' || state === 'archived'
        const overflow = rowOverflow(row, {
          canOperate,
          busyId,
          pending,
          onClose,
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
              <Link href={reportHref(row)} className="studies-row-cta">
                View results →
              </Link>
              {canOperate ? <RowOverflowMenu actions={overflow} /> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
