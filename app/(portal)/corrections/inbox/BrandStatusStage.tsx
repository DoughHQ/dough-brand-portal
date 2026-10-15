import Link from 'next/link'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import {
  brandClaimCopy,
  fieldLabel,
  formatCategoryPath,
  productTitle,
  waitingAge,
} from '@/lib/correctionsCase'
import { PRODUCT_NAME } from '@/lib/brand'
import { correctionsDeskHref } from '@/lib/correctionsDesk'
import { formatUtcStamp } from '@/lib/portal-ui/format'

export function StatusStage({
  row,
  nowMs,
  related,
  canReviewInOps,
  onOpenRelated,
  onExpandEvidence,
}: {
  row: CorrectionReviewRow
  nowMs: number
  related: CorrectionReviewRow[]
  canReviewInOps: boolean
  onOpenRelated: (row: CorrectionReviewRow) => void
  onExpandEvidence: () => void
}) {
  const title = productTitle(row)
  const copy = brandClaimCopy(row)
  const age = waitingAge(row.created_at, nowMs)
  const path = formatCategoryPath(row.current_category_path)
  const hasEvidence = Boolean(row.evidence_preview_url)
  const showDiff = Boolean(row.current_category && row.proposed_category_label)

  return (
    <article className="corr-case" data-correction-id={row.id}>
      <div className="corr-case-grid">
        <div className="corr-photo">
          {row.product_image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.product_image_url} alt={title} />
              <span className="corr-photo-badge">Product</span>
            </>
          ) : (
            <span className="corr-photo-letter">
              {(title.trim().slice(0, 1) || '?').toUpperCase()}
            </span>
          )}
        </div>

        <div className="corr-body">
          <div className="corr-age" title={formatUtcStamp(row.created_at)}>
            {age || formatUtcStamp(row.created_at)}
          </div>
          <h2 className="corr-product">{title}</h2>
          <p className="corr-identity">
            {[row.brand_name, path ?? row.current_category].filter(Boolean).join(' · ')}
          </p>

          <div className="corr-wait">
            <span className="corr-wait-pill">Waiting on {PRODUCT_NAME}</span>
            <p className="corr-wait-copy">{copy.status}</p>
          </div>

          <h3 className="corr-headline">{copy.headline}</h3>
          <p className="corr-sentence">{copy.sentence}</p>
          {showDiff ? (
            <p className="corr-diff">
              {row.current_category}
              {' → '}
              <span className="corr-diff-to">{row.proposed_category_label}</span>
            </p>
          ) : null}

          {hasEvidence ? (
            <button
              type="button"
              className="corr-evidence"
              onClick={onExpandEvidence}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.evidence_preview_url!} alt="Submitted evidence" />
            </button>
          ) : row.evidence_capture_path ? (
            <p className="corr-sentence">Photo unavailable</p>
          ) : null}

          <div className="corr-actions">
            <Link
              href={`/products/${row.product_id}`}
              className="corr-btn corr-btn-primary corr-product-cta"
            >
              Open product
            </Link>
            {canReviewInOps ? (
              <Link
                href={correctionsDeskHref({ focusId: row.id })}
                className="corr-btn corr-btn-ghost"
              >
                Review in Ops
              </Link>
            ) : null}
          </div>

          {related.length > 0 ? (
            <div className="corr-related">
              <div className="corr-related-kicker">
                {related.length === 1
                  ? '1 more report on this product'
                  : `${related.length} more reports on this product`}
              </div>
              {related.map((sib) => {
                const sibCopy = brandClaimCopy(sib)
                return (
                  <button
                    key={sib.id}
                    type="button"
                    className="corr-related-item"
                    onClick={() => onOpenRelated(sib)}
                  >
                    <span className="corr-related-field">{fieldLabel(sib)}</span>
                    <span className="corr-related-sentence">{sibCopy.sentence}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
