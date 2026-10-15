import { PRODUCT_NAME } from '@/lib/brand'

export function BrandCorrectionsEmpty({ loadingMore }: { loadingMore: boolean }) {
  return (
    <div className="corr-empty">
      {loadingMore ? (
        <p className="corr-empty-title">Loading…</p>
      ) : (
        <>
          <p className="corr-empty-title">Quiet catalog</p>
          <p className="corr-empty-body">
            No shopper reports waiting on your products. When someone flags a name, photo, or
            shelf, it shows up here while {PRODUCT_NAME} reviews it.
          </p>
        </>
      )}
    </div>
  )
}
