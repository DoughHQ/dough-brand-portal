'use client'

import type { CorrectionReviewRow, CorrectionReviewsPageCursor } from '@/lib/corrections.shared'
import { BrandCorrectionsEmpty } from './inbox/BrandCorrectionsEmpty'
import { BrandCorrectionsHead } from './inbox/BrandCorrectionsHead'
import { BrandCorrectionsRail } from './inbox/BrandCorrectionsRail'
import { StatusStage } from './inbox/BrandStatusStage'
import { useBrandCorrections } from './inbox/useBrandCorrections'
import '../admin/corrections/correctionsCase.css'

interface Props {
  initialRows: CorrectionReviewRow[]
  initialHasMore?: boolean
  initialCursor?: CorrectionReviewsPageCursor | null
  pendingCount?: number
  focusId?: string | null
  canReviewInOps?: boolean
  renderedAt?: number
}

export default function BrandCorrectionsClient({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  pendingCount = 0,
  focusId = null,
  canReviewInOps = false,
  renderedAt,
}: Props) {
  const desk = useBrandCorrections({
    initialRows,
    initialHasMore,
    initialCursor,
    pendingCount,
    focusId,
    renderedAt,
  })

  return (
    <div className="corr-page">
      <BrandCorrectionsHead
        headerLabel={desk.headerLabel}
        canReviewInOps={canReviewInOps}
        focused={desk.focused}
      />

      {desk.notice && <div className="corr-banner corr-banner-info">{desk.notice}</div>}

      {desk.rows.length === 0 ? (
        <BrandCorrectionsEmpty loadingMore={desk.loadingMore} />
      ) : (
        <div className="corr-desk">
          <BrandCorrectionsRail
            rows={desk.rows}
            focusIndex={desk.focusIndex}
            headerLabel={desk.headerLabel}
            nowMs={desk.nowMs}
            activeRailRef={desk.activeRailRef}
            dispatchFocus={(index) => desk.dispatch({ type: 'focus', index })}
            hasMore={desk.hasMore}
            loadingMore={desk.loadingMore}
            cursor={desk.cursor}
            appendPage={() => void desk.appendPage()}
          />

          {desk.focused ? (
            <StatusStage
              row={desk.focused}
              nowMs={desk.nowMs}
              related={desk.related}
              canReviewInOps={canReviewInOps}
              onOpenRelated={(row) => desk.dispatch({ type: 'openRelated', row })}
              onExpandEvidence={() => desk.setExpandedImg(desk.focused?.evidence_preview_url ?? null)}
            />
          ) : null}
        </div>
      )}

      {desk.expandedImg && (
        <div
          role="presentation"
          className="corr-lightbox"
          onClick={() => desk.setExpandedImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo */}
          <img src={desk.expandedImg} alt="Evidence full size" />
        </div>
      )}
    </div>
  )
}
