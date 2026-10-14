'use client'

import type { CorrectionReviewRow, CorrectionReviewsPageCursor } from '@/lib/corrections.shared'
import { CaseStage } from './review/CaseStage'
import { CorrectionRail } from './review/CorrectionRail'
import { CorrectionsDeskEmpty } from './review/CorrectionsDeskEmpty'
import { CorrectionsDeskHead } from './review/CorrectionsDeskHead'
import { CorrectionsDeskNotices } from './review/CorrectionsDeskNotices'
import { CorrectionsLightbox } from './review/CorrectionsLightbox'
import { useCorrectionsReview } from './review/useCorrectionsReview'
import './correctionsCase.css'

interface Props {
  initialRows: CorrectionReviewRow[]
  initialHasMore?: boolean
  initialCursor?: CorrectionReviewsPageCursor | null
  focusId?: string | null
  productFilterId?: number | null
  workspaceBrandId?: number | null
  workspaceBrandName?: string | null
  renderedAt?: number
}

export default function CorrectionsReviewClient({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  focusId = null,
  productFilterId = null,
  workspaceBrandId = null,
  workspaceBrandName = null,
  renderedAt,
}: Props) {
  const {
    nowMs,
    rows,
    focusIndex,
    focused,
    related,
    hasMore,
    cursor,
    loadingMore,
    busyId,
    error,
    setError,
    expandedImg,
    setExpandedImg,
    rejectChipById,
    setRejectChipById,
    editorOpenId,
    setEditorOpenId,
    flash,
    notice,
    activeRailRef,
    dispatch,
    appendPage,
    openRelated,
    handleExtract,
    handleDecision,
    filtered,
    queueLabel,
  } = useCorrectionsReview({
    initialRows,
    initialHasMore,
    initialCursor,
    focusId,
    productFilterId,
    renderedAt,
  })

  return (
    <div className="corr-page">
      <CorrectionsDeskHead
        filtered={filtered}
        focusId={focused?.id}
        queueLabel={queueLabel}
      />
      <CorrectionsDeskNotices error={error} notice={notice} flash={flash} />

      {rows.length === 0 ? (
        <CorrectionsDeskEmpty loadingMore={loadingMore} filtered={filtered} />
      ) : (
        <div className="corr-desk">
          <CorrectionRail
            rows={rows}
            focusIndex={focusIndex}
            nowMs={nowMs}
            busyId={busyId}
            hasMore={hasMore}
            loadingMore={loadingMore}
            cursor={cursor}
            queueLabel={queueLabel}
            activeRailRef={activeRailRef}
            dispatch={dispatch}
            appendPage={appendPage}
          />

          {focused ? (
            <CaseStage
              row={focused}
              busy={busyId === focused.id}
              nowMs={nowMs}
              workspaceBrandId={workspaceBrandId}
              workspaceBrandName={workspaceBrandName}
              editorOpen={editorOpenId === focused.id}
              rejectChip={rejectChipById[focused.id] ?? null}
              related={related}
              onOpenRelated={openRelated}
              onExtract={() => void handleExtract(focused.id)}
              onOpenEditor={() => setEditorOpenId(focused.id)}
              onCloseEditor={() => setEditorOpenId(null)}
              onExpandEvidence={() => setExpandedImg(focused.evidence_preview_url)}
              onPickReject={(chip) => {
                setRejectChipById((prev) => ({ ...prev, [focused.id]: chip }))
                setError(null)
              }}
              onApply={() => void handleDecision(focused.id, 'approved')}
              onApplyValue={(value, skuVariantId) => {
                void handleDecision(focused.id, 'overridden', {
                  correctedValue: value,
                  skuVariantId,
                })
              }}
              onReject={() => {
                const chip = rejectChipById[focused.id]
                if (!chip) {
                  setError('Pick a reject reason first.')
                  return
                }
                void handleDecision(focused.id, 'rejected', { notes: chip })
              }}
            />
          ) : null}
        </div>
      )}

      <CorrectionsLightbox expandedImg={expandedImg} setExpandedImg={setExpandedImg} />
    </div>
  )
}
