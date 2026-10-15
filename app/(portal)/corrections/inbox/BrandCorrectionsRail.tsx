import type { RefObject } from 'react'
import type { CorrectionReviewRow, CorrectionReviewsPageCursor } from '@/lib/corrections.shared'
import { brandClaimCopy, fieldLabel, productTitle, waitingAge } from '@/lib/correctionsCase'
import { BrandProductArt } from './BrandProductArt'

export function BrandCorrectionsRail({
  rows,
  focusIndex,
  headerLabel,
  nowMs,
  activeRailRef,
  dispatchFocus,
  hasMore,
  loadingMore,
  cursor,
  appendPage,
}: {
  rows: CorrectionReviewRow[]
  focusIndex: number
  headerLabel: string
  nowMs: number
  activeRailRef: RefObject<HTMLButtonElement | null>
  dispatchFocus: (index: number) => void
  hasMore: boolean
  loadingMore: boolean
  cursor: CorrectionReviewsPageCursor | null
  appendPage: () => void
}) {
  return (
      <aside className="corr-rail" aria-label="Correction inbox">
        <div className="corr-rail-head">
          <span className="corr-rail-kicker">Inbox</span>
          <span className="corr-rail-count">{headerLabel}</span>
        </div>
        <div className="corr-rail-list">
          {rows.map((row, idx) => {
            const title = productTitle(row)
            const copy = brandClaimCopy(row)
            const age = waitingAge(row.created_at, nowMs)
            const on = idx === focusIndex
            return (
              <button
                key={row.id}
                type="button"
                className={on ? 'corr-rail-item is-on' : 'corr-rail-item'}
                aria-current={on ? 'true' : undefined}
                ref={on ? activeRailRef : undefined}
                onClick={() => dispatchFocus(idx)}
              >
                <BrandProductArt
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
              disabled={loadingMore || !cursor}
              onClick={() => void appendPage()}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : null}
          <span className="corr-keys">J / K move</span>
        </div>
      </aside>
  )
}
