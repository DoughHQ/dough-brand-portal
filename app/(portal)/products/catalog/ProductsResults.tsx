import type { BrandProductPageItem } from '@/lib/brandHome/parseBrandProductPage'
import type { FacetSummaryRow } from '@/lib/facets/productFacets'
import { PhoneProductRow, ProductCard } from './productCards'
import { ProductListRows } from './ProductListRows'

export function ProductsResults({
  items,
  viewMode,
  facetById,
  isPending,
  debouncedSearch,
}: {
  items: BrandProductPageItem[]
  viewMode: 'grid' | 'list'
  facetById: Record<number, FacetSummaryRow>
  isPending: boolean
  debouncedSearch: string
}) {
  return (
    <>
      {isPending ? (
        <div style={{ padding: '24px 0', fontSize: 14, color: 'var(--ink-30)' }}>Updating…</div>
      ) : null}

      {!isPending && items.length === 0 ? (
        <div className="cat-browse-empty">
          <div className="cat-browse-empty-title">
            {debouncedSearch ? 'No products found' : 'No products in this catalog yet.'}
          </div>
          {debouncedSearch ? (
            <p className="cat-browse-empty-sub">Try another product name.</p>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="prod-phone-list" aria-label="Products">
          {items.map((product) => (
            <PhoneProductRow key={product.productId} product={product} />
          ))}
        </div>
      ) : null}

      {items.length > 0 && viewMode === 'grid' ? (
        <div className="prod-desktop-views cat-tile-grid">
          {items.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              summary={facetById[product.productId]}
            />
          ))}
        </div>
      ) : null}

      {items.length > 0 && viewMode === 'list' ? (
        <ProductListRows items={items} facetById={facetById} />
      ) : null}
    </>
  )
}
