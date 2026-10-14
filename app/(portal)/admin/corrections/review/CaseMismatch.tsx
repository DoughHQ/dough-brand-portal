import Link from 'next/link'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { fieldLabel } from '@/lib/correctionsCase'

export function CaseMismatch({
  row,
  busy,
  mismatch,
  brandSib,
  onOpenRelated,
}: {
  row: CorrectionReviewRow
  busy: boolean
  mismatch: { sentence: string; thisClaimFixesIt: boolean } | null
  brandSib: CorrectionReviewRow | null
  onOpenRelated: (row: CorrectionReviewRow) => void
}) {
  if (!mismatch) return null
  return (
    <div className="corr-mismatch">
      <p className="corr-mismatch-sentence">{mismatch.sentence}</p>
      {mismatch.thisClaimFixesIt ? (
        <p className="corr-mismatch-note">This claim is the brand fix.</p>
      ) : (
        <>
          <p className="corr-mismatch-note">
            Filing {fieldLabel(row).toLowerCase()} does not change the brand.
          </p>
          <div className="corr-mismatch-actions">
            {brandSib ? (
              <button
                type="button"
                className="corr-btn corr-btn-ghost"
                disabled={busy}
                onClick={() => onOpenRelated(brandSib)}
              >
                Open the brand claim
              </button>
            ) : (
              <Link
                href={`/products/${row.product_id}`}
                target="_blank"
                rel="noreferrer"
                className="corr-mismatch-link"
              >
                Refile brand on the product
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
