import type { Dispatch, RefObject } from 'react'
import {
  claimCopy,
  fieldLabel,
  productTitle,
  waitingAge,
} from '@/lib/correctionsCase'
import type { CorrectionReviewRow, CorrectionReviewsPageCursor } from '@/lib/corrections.shared'
import type { DeskQueueAction } from '@/lib/correctionsDesk'

function ProductArt({
  url,
  name,
  className,
  letterClass,
}: {
  url: string | null
  name: string
  className: string
  letterClass: string
}) {
  if (url) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo */}
        <img src={url} alt="" />
      </div>
    )
  }
  const letter = (name.trim().slice(0, 1) || '?').toUpperCase()
  return (
    <div className={className} aria-hidden>
      <span className={letterClass}>{letter}</span>
    </div>
  )
}

export function CorrectionRail({
  rows,
  focusIndex,
  nowMs,
  busyId,
  hasMore,
  loadingMore,
  cursor,
  queueLabel,
  activeRailRef,
  dispatch,
  appendPage,
}: {
  rows: CorrectionReviewRow[]
  focusIndex: number
  nowMs: number
  busyId: string | null
  hasMore: boolean
  loadingMore: boolean
  cursor: CorrectionReviewsPageCursor | null
  queueLabel: string
  activeRailRef: RefObject<HTMLButtonElement | null>
  dispatch: Dispatch<DeskQueueAction<CorrectionReviewRow>>
  appendPage: () => Promise<boolean>
}) {
  return (
    <aside className="corr-rail" aria-label="Correction queue">
      <div className="corr-rail-head">
        <span className="corr-rail-kicker">Queue</span>
        <span className="corr-rail-count">{queueLabel}</span>
      </div>
      <div className="corr-rail-list">
        {rows.map((row, idx) => {
          const title = productTitle(row)
          const copy = claimCopy(row)
          const age = waitingAge(row.created_at, nowMs)
          const on = idx === focusIndex
          return (
            <button
              key={row.id}
              type="button"
              className={on ? 'corr-rail-item is-on' : 'corr-rail-item'}
              aria-current={on ? 'true' : undefined}
              ref={on ? activeRailRef : undefined}
              disabled={busyId != null}
              onClick={() => dispatch({ type: 'focus', index: idx })}
            >
              <ProductArt
                url={row.product_image_url}
                name={title}
                className="corr-thumb"
                letterClass="corr-thumb-letter"
              />
              <div className="corr-rail-copy">
                <div className="corr-row-type">{fieldLabel(row)}</div>
                <div className="corr-row-title">{title}</div>
                <div className="corr-row-claim">{copy.sentence}</div>
              </div>
              <div className="corr-row-age">{age}</div>
            </button>
          )
        })}
      </div>
      <div className="corr-rail-foot">
        {hasMore ? (
          <button
            type="button"
            className="corr-btn corr-btn-ghost corr-rail-more"
            disabled={loadingMore || !cursor || busyId != null}
            onClick={() => void appendPage()}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        ) : (
          <span className="corr-keys">J / K move · A apply</span>
        )}
        {hasMore ? <span className="corr-keys">J / K move · A apply</span> : null}
      </div>
    </aside>
  )
}
