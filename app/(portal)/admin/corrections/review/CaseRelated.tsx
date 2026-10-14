import { claimCopy, fieldLabel } from '@/lib/correctionsCase'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'

export function CaseRelated({
  related,
  busy,
  onOpenRelated,
}: {
  related: CorrectionReviewRow[]
  busy: boolean
  onOpenRelated: (row: CorrectionReviewRow) => void
}) {
  if (related.length === 0) return null
  return (
    <div className="corr-related">
      <div className="corr-related-kicker">
        {related.length === 1
          ? '1 more claim on this product'
          : `${related.length} more claims on this product`}
      </div>
      {related.map((sib) => {
        const sibCopy = claimCopy(sib)
        return (
          <button
            key={sib.id}
            type="button"
            className="corr-related-item"
            disabled={busy}
            onClick={() => onOpenRelated(sib)}
          >
            <span className="corr-related-field">{fieldLabel(sib)}</span>
            <span className="corr-related-sentence">{sibCopy.sentence}</span>
          </button>
        )
      })}
    </div>
  )
}
