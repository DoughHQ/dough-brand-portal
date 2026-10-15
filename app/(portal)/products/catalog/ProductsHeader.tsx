import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import type { Brand } from '@/lib/queries'
import { formatUtcStamp } from '@/lib/portal-ui/format'
import type { BrandCatalogSummary } from '@/lib/brandHome/parseBrandProductPage'
import { PRODUCT_NAME } from '@/lib/brand'
import { supportHref } from '@/lib/productMaster/support'

export function ProductsHeader({
  brand,
  summary,
  listError,
  facetError,
  addOpen,
  setAddOpen,
}: {
  brand: Brand
  summary: BrandCatalogSummary | null
  listError: string | null
  facetError: string | null
  addOpen: boolean
  setAddOpen: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <header className="cat-header">
      <div className="cat-header-copy">
        <div className="cat-eyebrow">{brand.brand_name}</div>
        <h1 className="cat-title cat-title-sr">Products</h1>
        <p className="cat-lede">
          Manage the products your brand has on {PRODUCT_NAME} and see where signal is beginning to
          build.
        </p>
        {summary?.catalogRefreshedAt ? (
          <p style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 8, lineHeight: 1.45 }}>
            Catalog summary · updated {formatUtcStamp(summary.catalogRefreshedAt)}
          </p>
        ) : null}
        {listError ? (
          <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8, lineHeight: 1.45 }}>
            Products page failed ({listError}).
          </p>
        ) : null}
        {facetError ? (
          <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8, lineHeight: 1.45 }}>
            Attributes summary unavailable ({facetError}).
          </p>
        ) : null}
      </div>
      <div className="prod-header-actions" style={{ position: 'relative' }}>
        <button
          type="button"
          className="portal-btn portal-btn-cta cat-primary-cta"
          aria-expanded={addOpen}
          aria-controls="prod-add-panel"
          onClick={() => setAddOpen((open) => !open)}
        >
          + Add product
        </button>
        {addOpen ? (
          <div
            id="prod-add-panel"
            className="prod-add-panel portal-panel"
            role="region"
            aria-label="Add a product"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/prototypes" className="bh-link" onClick={() => setAddOpen(false)}>
                Not on shelves yet? <strong>Add it as a prototype</strong>
              </Link>
              <a
                href={supportHref(
                  `Add my product: ${brand.brand_name_display ?? brand.brand_name}`
                )}
                className="bh-link"
              >
                Already on shelves? <strong>Send us the barcode</strong>
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
