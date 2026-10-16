import type { CorrectionReviewRow } from '@/lib/corrections.shared'

export function CasePhoto({
  row,
  title,
}: {
  row: CorrectionReviewRow
  title: string
}) {
  return (
    <div className="corr-photo">
      {row.product_image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo */}
          <img src={row.product_image_url} alt={title} />
          <span className="corr-photo-badge">Product</span>
        </>
      ) : (
        <span className="corr-photo-letter">
          {(title.trim().slice(0, 1) || '?').toUpperCase()}
        </span>
      )}
    </div>
  )
}
