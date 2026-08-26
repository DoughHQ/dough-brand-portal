import Link from 'next/link'
import type { ReactNode } from 'react'
import { supportHref } from '@/lib/productMaster/support'
import {
  categoryProductSummary,
  formatLedgerComparisons,
  lockedCategoryCta,
  noProductsCategoryCopy,
  type LockedCategoryProduct,
} from '@/lib/categoryProductsByL2'
import '@/components/categories/categoriesPage.css'

function n(value: number): string {
  return Math.max(0, Math.trunc(value)).toLocaleString()
}

function letter(name: string): string {
  return (name.trim().slice(0, 1) || '?').toUpperCase()
}

function formatElo(value: number | null | undefined): string {
  return value == null ? '—' : String(Math.round(value))
}

function ProductThumb({ product }: { product: LockedCategoryProduct }) {
  if (product.image_url) {
    return (
      <div className="cat-locked-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt="" />
      </div>
    )
  }
  return (
    <div className="cat-locked-thumb cat-locked-thumb-fallback" aria-hidden>
      {letter(product.product_name_clean)}
    </div>
  )
}

function N1Pill() {
  return <span className="cat-locked-n1">n=1 · not population data</span>
}

function EloBlock({ product }: { product: LockedCategoryProduct }) {
  const elo = product.populationElo
  if (!elo) return null
  return (
    <div className="cat-locked-elo">
      <span>
        ELO {formatElo(elo.eloScore)}
        {' · '}
        {elo.winRatePct == null ? '— win' : `${Math.round(elo.winRatePct)}% win`}
        {' · '}
        {elo.userPercentile == null ? '— percentile' : `Percentile ${Math.round(elo.userPercentile)}`}
      </span>
      <N1Pill />
    </div>
  )
}

function LockedShell({
  categoryName,
  lede,
  children,
}: {
  categoryName: string
  lede?: string
  children: ReactNode
}) {
  return (
    <div className="cat-page">
      <Link href="/categories" className="cat-locked-back">
        ← Categories
      </Link>
      <header className="cat-header">
        <div className="cat-header-copy">
          <h1 className="cat-title">{categoryName}</h1>
          {lede ? <p className="cat-lede">{lede}</p> : null}
        </div>
      </header>
      {children}
    </div>
  )
}

export default function LockedCategoryPreview({
  categoryName,
  products,
  loadFailed,
}: {
  categoryName: string
  products: LockedCategoryProduct[]
  loadFailed?: boolean
}) {
  if (loadFailed) {
    return (
      <LockedShell categoryName={categoryName}>
        <div className="cat-locked-vacant">
          <p className="cat-locked-vacant-line">We couldn’t load this category right now.</p>
        </div>
      </LockedShell>
    )
  }

  if (products.length === 0) {
    const copy = noProductsCategoryCopy(categoryName)
    return (
      <LockedShell categoryName={categoryName}>
        <div className="cat-locked-vacant">
          <p className="cat-locked-vacant-line">{copy.line}</p>
          <p className="cat-locked-vacant-sub">{copy.sub}</p>
          <a className="cat-locked-soft-cta" href={supportHref(copy.cta.subject)}>
            {copy.cta.label}
          </a>
        </div>
      </LockedShell>
    )
  }

  const summary = categoryProductSummary(products)
  const cta = lockedCategoryCta(summary.totalComparisons, categoryName)

  return (
    <LockedShell categoryName={categoryName} lede="Your products in this category on Dough.">
      <div className="cat-locked-summary">
        <div className="cat-summary-card">
          <div>
            <div className="cat-summary-label">Products</div>
            <div className="cat-summary-value">{n(summary.products)}</div>
            <div className="cat-summary-hint">Mapped in this category</div>
          </div>
        </div>
        <div className="cat-summary-card">
          <div>
            <div className="cat-summary-label">With comparisons</div>
            <div className="cat-summary-value">{n(summary.withComparisons)}</div>
            <div className="cat-summary-hint">Products with a ledger count</div>
          </div>
        </div>
        <div className="cat-summary-card">
          <div>
            <div className="cat-summary-label">Total comparisons</div>
            <div className="cat-summary-value">{n(summary.totalComparisons)}</div>
            <div className="cat-summary-hint">Honest ledger total</div>
          </div>
        </div>
      </div>

      <div className="cat-locked-list">
        {products.map((product) => (
          <article key={product.product_id} className="cat-locked-product">
            <ProductThumb product={product} />
            <div className="cat-locked-product-copy">
              {product.l3_name ? <div className="cat-kicker">{product.l3_name}</div> : null}
              <div className="cat-locked-product-name">{product.product_name_clean}</div>
              <EloBlock product={product} />
            </div>
            <div className="cat-locked-product-stat">
              {formatLedgerComparisons(product.battles_ledger)}
            </div>
          </article>
        ))}
      </div>

      <div className="cat-locked-cta">
        <p className="cat-locked-cta-sub">{cta.sub}</p>
        <a className="cat-primary-cta" href={supportHref(cta.subject)}>
          {cta.label}
        </a>
      </div>
    </LockedShell>
  )
}
