import Link from 'next/link'
import { ProductArt } from '@/components/products/ProductArt'
import { facetFooterParts, type FacetSummaryRow } from '@/lib/facets/productFacets'
import type { BrandProductPageItem } from '@/lib/brandHome/parseBrandProductPage'

function FacetFooterLink({
  productId,
  summary,
}: {
  productId: number
  summary: FacetSummaryRow | undefined
}) {
  if (!summary) return null
  const parts = facetFooterParts(summary)
  if (!parts) return null

  return (
    <div className="pf-footer">
      <Link href={`/products/${productId}?tab=facets`} className="pf-footer__hit">
        <span className="pf-footer__text">
          {parts.map((p, i) => (
            <span key={i}>
              {i > 0 ? ' · ' : null}
              <span className={p.className}>{p.text}</span>
            </span>
          ))}
        </span>
        {summary.pending_count > 0 ? (
          <span className="pf-footer__pending">{summary.pending_count} pending review</span>
        ) : null}
        <span className="pf-footer__chev" aria-hidden>
          ›
        </span>
      </Link>
    </div>
  )
}

export function ProductThumb({
  name,
  imageUrl,
  className = 'prod-list-thumb',
}: {
  name: string
  imageUrl: string | null
  className?: string
}) {
  return (
    <div className={className} aria-hidden>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo
        <img src={imageUrl} alt="" />
      ) : (
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--ink-30)' }}>
          {(name[0] || '?').toUpperCase()}
        </span>
      )}
    </div>
  )
}

export function PhoneProductRow({ product }: { product: BrandProductPageItem }) {
  const href = `/products/${product.productId}`
  const category = product.l3Name ?? product.l2Name ?? product.category
  const meta = [
    category,
    product.hasBattleData ? `${product.totalBattles.toLocaleString()} battles` : 'No signal yet',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={href} className="prod-phone-row">
      <ProductThumb name={product.name} imageUrl={product.imageUrl} className="prod-phone-thumb" />
      <span className="prod-phone-copy">
        <span className="prod-phone-name">{product.name}</span>
        {meta ? <span className="prod-phone-meta">{meta}</span> : null}
      </span>
      <span className="prod-phone-chev" aria-hidden>
        ›
      </span>
    </Link>
  )
}

export function ProductCard({
  product,
  summary,
}: {
  product: BrandProductPageItem
  summary: FacetSummaryRow | undefined
}) {
  const href = `/products/${product.productId}`
  const category = product.l3Name ?? product.l2Name ?? product.category
  return (
    <article className="cat-tile">
      <Link href={href} className="prod-tile-link">
        <ProductArt product={{ name: product.name, image_url: product.imageUrl }} />
        <div className="cat-tile-body">
          {category ? <div className="cat-kicker">{category}</div> : null}
          <div className="prod-tile-name">{product.name}</div>
          <div className="cat-tile-chip-row">
            {product.hasBattleData ? (
              <span className="cat-chip cat-chip-live">
                <span className="cat-chip-dot" aria-hidden />
                With battle data
              </span>
            ) : (
              <span className="cat-chip cat-chip-empty">
                <span className="cat-chip-dot" aria-hidden />
                No signal yet
              </span>
            )}
          </div>
        </div>
        <div className="cat-tile-action">
          <span className="cat-tile-btn cat-tile-btn-solid">Manage product</span>
        </div>
      </Link>
      <FacetFooterLink productId={product.productId} summary={summary} />
    </article>
  )
}
