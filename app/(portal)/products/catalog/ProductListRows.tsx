import Link from 'next/link'
import { PRODUCT_NAME } from '@/lib/brand'
import type { BrandProductPageItem } from '@/lib/brandHome/parseBrandProductPage'
import type { FacetSummaryRow } from '@/lib/facets/productFacets'
import { ProductThumb } from './productCards'
import { n } from './summaryCards'

export function ProductListRows({
  items,
  facetById,
}: {
  items: BrandProductPageItem[]
  facetById: Record<number, FacetSummaryRow>
}) {
  return (
    <div className="prod-desktop-views prod-list">
      <div className="prod-list-head">
        <span />
        <span>Product</span>
        <span className="prod-list-hide-narrow">Category</span>
        <span className="prod-list-hide-narrow">Attributes</span>
        <span style={{ textAlign: 'right' }}>Battles</span>
        <span style={{ textAlign: 'right' }}> </span>
      </div>
      {items.map((product) => {
        const isClaimed = product.isClaimed
        const summaryRow = facetById[product.productId]
        const href = `/products/${product.productId}`
        return (
          <div key={product.productId} className="prod-list-row prod-list-row--split">
            <Link href={href} className="prod-list-row__main">
              <ProductThumb name={product.name} imageUrl={product.imageUrl} />
              <div className="prod-list-row__identity">
                <div className="prod-list-row__name">{product.name}</div>
              </div>
              <div className="prod-list-hide-narrow prod-list-row__barcode">
                {product.l3Name ?? product.l2Name ?? product.category ?? '—'}
              </div>
            </Link>
            <div className="prod-list-hide-narrow" style={{ minWidth: 0 }}>
              {summaryRow ? (
                <Link
                  href={`/products/${product.productId}?tab=facets`}
                  className="pf-list-facet"
                >
                  <span>
                    {summaryRow.derived_count} from {PRODUCT_NAME}
                    {summaryRow.declared_count > 0 ? (
                      <>
                        {' · '}
                        <span className="pf-list-facet__added">
                          {summaryRow.declared_count} added
                        </span>
                      </>
                    ) : null}
                    {' · '}
                    {Math.max(0, summaryRow.declarable_total - summaryRow.declarable_filled)} to add
                  </span>
                  {summaryRow.pending_count > 0 ? (
                    <span className="pf-list-facet__pending">
                      {summaryRow.pending_count} pending
                    </span>
                  ) : null}
                </Link>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>—</span>
              )}
            </div>
            <Link
              href={href}
              className="prod-list-row__battles"
              style={{
                color: product.totalBattles > 0 ? 'var(--heading)' : 'var(--ink-30)',
              }}
            >
              {product.totalBattles > 0 ? n(product.totalBattles) : '—'}
            </Link>
            <div style={{ textAlign: 'right' }}>
              <span
                className={`cat-chip ${isClaimed ? 'cat-chip-live' : 'cat-chip-empty'}`}
                style={{ justifySelf: 'end' }}
              >
                {isClaimed ? 'Active' : 'Not claimed'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
