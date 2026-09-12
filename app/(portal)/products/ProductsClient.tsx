'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { PortalUser, Brand, BrandSubscription, BrandProduct } from '@/lib/queries'
import { ProductArt } from '@/components/products/ProductArt'
import { fetchProductFacetSummaries } from '@/lib/facets/api'
import {
  facetFooterParts,
  type FacetSummaryRow,
} from '@/lib/facets/productFacets'
import '@/components/categories/categoriesPage.css'
import '@/components/products/productTile.css'
import '@/components/products/productFacets.css'
import './productsPage.css'

type PortfolioProduct = {
  product_id: number
  product_name_clean: string
  product_name_display: string
  image_url: string | null
  primary_barcode: string | null
  l2_name: string | null
  l3_name: string | null
  price_tier_label: string | null
  total_battles: number
  elo_score: number | null
  win_rate_pct: number | null
  has_battle_data: boolean
  package_size_value: number | null
  package_size_uom: string | null
}

interface ProductsClientProps {
  portalUser: PortalUser
  brand: Brand
  subscription: BrandSubscription | null
  products: BrandProduct[]
  claimedIds: number[]
  isImpersonating?: boolean
}

function n(value: number): string {
  return Math.max(0, Math.trunc(value)).toLocaleString()
}

function SageGlyph({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: number
  hint: string
  icon: string
}) {
  return (
    <div className="cat-summary-card">
      <div className="cat-summary-icon">
        <SageGlyph d={icon} />
      </div>
      <div>
        <div className="cat-summary-label">{label}</div>
        <div className="cat-summary-value">{n(value)}</div>
        <div className="cat-summary-hint">{hint}</div>
      </div>
    </div>
  )
}

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

function ProductThumb({
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
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" />
      ) : (
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--ink-30)' }}>
          {(name[0] || '?').toUpperCase()}
        </span>
      )}
    </div>
  )
}

/** Compact-only row — one real link, no display:contents, phone-sized hit target. */
function PhoneProductRow({ product }: { product: PortfolioProduct }) {
  const href = `/products/${product.product_id}`
  const category = product.l3_name ?? product.l2_name
  const meta = [
    category,
    product.has_battle_data
      ? `${product.total_battles.toLocaleString()} battles`
      : 'No signal yet',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={href} className="prod-phone-row">
      <ProductThumb name={product.product_name_clean} imageUrl={product.image_url} className="prod-phone-thumb" />
      <span className="prod-phone-copy">
        <span className="prod-phone-name">{product.product_name_clean}</span>
        {meta ? <span className="prod-phone-meta">{meta}</span> : null}
      </span>
      <span className="prod-phone-chev" aria-hidden>
        ›
      </span>
    </Link>
  )
}

function ProductCard({
  product,
  summary,
}: {
  product: PortfolioProduct
  summary: FacetSummaryRow | undefined
}) {
  const href = `/products/${product.product_id}`
  const category = product.l3_name ?? product.l2_name
  return (
    <article className="cat-tile">
      <Link href={href} className="prod-tile-link">
        <ProductArt
          product={{ name: product.product_name_clean, image_url: product.image_url }}
        />
        <div className="cat-tile-body">
          {category ? <div className="cat-kicker">{category}</div> : null}
          <div className="prod-tile-name">{product.product_name_clean}</div>
          {product.primary_barcode ? (
            <div className="prod-tile-meta">{product.primary_barcode}</div>
          ) : null}
          <div className="cat-tile-chip-row">
            {product.has_battle_data ? (
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
      <FacetFooterLink productId={product.product_id} summary={summary} />
    </article>
  )
}

export default function ProductsClient({
  brand,
  products: serverProducts,
  claimedIds,
  isImpersonating,
}: ProductsClientProps) {
  const [portfolioProducts, setPortfolioProducts] = useState<PortfolioProduct[]>([])
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [search, setSearch] = useState('')
  const [showBattledOnly, setShowBattledOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [facetById, setFacetById] = useState<Record<number, FacetSummaryRow>>({})
  const [facetError, setFacetError] = useState<string | null>(null)

  const loadFacetSummaries = useCallback(async (products: PortfolioProduct[]) => {
    const ids = products.map((p) => p.product_id)
    if (ids.length === 0) {
      setFacetById({})
      return
    }
    const supabase = createClient()
    const { rows, error } = await fetchProductFacetSummaries(supabase, ids)
    if (error) setFacetError(error)
    else setFacetError(null)
    const map: Record<number, FacetSummaryRow> = {}
    for (const row of rows) map[row.product_id] = row
    setFacetById(map)
  }, [])

  useEffect(() => {
    let cancelled = false
    const client = createClient()
    client
      .rpc('get_brand_products_portfolio', { p_brand_id: brand.brand_id })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('portfolio error:', error)
          setPortfolioError(error.message)
        }
        const rows = (data ?? []) as PortfolioProduct[]
        let next: PortfolioProduct[]
        if (rows.length > 0) {
          next = rows
          setPortfolioProducts(rows)
          setUsingFallback(false)
        } else {
          next = serverProducts.map((p) => ({
            product_id: p.product_id,
            product_name_clean: p.product_name_clean,
            product_name_display: p.product_name_display,
            image_url: p.image_url,
            primary_barcode: null,
            l2_name: p.l2_name,
            l3_name: p.l3_name,
            price_tier_label: p.price_tier_label,
            total_battles: p.total_battles ?? p.battles_total ?? 0,
            elo_score: p.elo_score,
            win_rate_pct:
              p.battles_total > 0
                ? Math.round((p.battles_won / p.battles_total) * 1000) / 10
                : null,
            has_battle_data: (p.battles_total ?? 0) > 0,
            package_size_value: null,
            package_size_uom: null,
          }))
          setPortfolioProducts(next)
          setUsingFallback(true)
        }
        setLoadingPortfolio(false)
        void loadFacetSummaries(next)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.brand_id])

  const claimedIdSet = new Set(claimedIds)
  const filtered = portfolioProducts.filter((p) => {
    const matchSearch =
      !search || p.product_name_clean.toLowerCase().includes(search.toLowerCase())
    const matchBattled = !showBattledOnly || p.has_battle_data
    return matchSearch && matchBattled
  })
  const battledCount = portfolioProducts.filter((p) => p.has_battle_data).length
  const categoryCount = new Set(
    portfolioProducts.map((p) => p.l2_name).filter((name): name is string => Boolean(name))
  ).size
  const awaitingClaim = portfolioProducts.filter((p) => !claimedIdSet.has(p.product_id)).length

  return (
    <div className="cat-page">
      {isImpersonating ? (
        <div
          style={{
            background: 'var(--amber-pale)',
            border: '1px solid rgba(192,120,24,0.2)',
            borderRadius: 13,
            padding: '10px 16px',
            marginBottom: 24,
            fontSize: 12,
            color: 'var(--amber)',
          }}
        >
          Viewing as {brand.brand_name} — this is exactly what they see.
        </div>
      ) : null}

      <header className="cat-header">
        <div className="cat-header-copy">
          <div className="cat-eyebrow">{brand.brand_name}</div>
          <h1 className="cat-title">Your products</h1>
          <p className="cat-lede">
            Manage the products your brand has on Dough and see where signal is beginning to build.
          </p>
          {(portfolioError || usingFallback) && (
            <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8, lineHeight: 1.45 }}>
              {portfolioError
                ? `Portfolio RPC failed (${portfolioError}). Showing server catalog.`
                : 'Portfolio returned no rows — showing server catalog so you can still open products.'}
            </p>
          )}
          {facetError ? (
            <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8, lineHeight: 1.45 }}>
              Attributes summary unavailable ({facetError}).
            </p>
          ) : null}
        </div>
        <div className="prod-header-actions">
          <button type="button" className="cat-primary-cta" onClick={() => alert('Add product coming soon')}>
            + Add product
          </button>
        </div>
      </header>

      <div className="cat-summary">
        <SummaryCard
          label="Products"
          value={portfolioProducts.length}
          hint="In your portfolio"
          icon="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        />
        <SummaryCard
          label="With battle data"
          value={battledCount}
          hint="Products with signal"
          icon="M4 14l4-4 4 3 6-7"
        />
        <SummaryCard
          label="Categories represented"
          value={categoryCount}
          hint="Across your portfolio"
          icon="M4 6h16M4 12h16M4 18h10"
        />
        <SummaryCard
          label="Awaiting claim"
          value={awaitingClaim}
          hint="Unclaimed products"
          icon="M12 8v5l3 2M12 21a9 9 0 1 0-9-9"
        />
      </div>

      <div className="prod-toolbar">
        <div className="cat-browse-search-wrap" style={{ margin: 0 }}>
          <svg className="cat-browse-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            className="cat-browse-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
          />
        </div>
        <button
          type="button"
          className={`prod-filter${showBattledOnly ? ' prod-filter-on' : ''}`}
          onClick={() => setShowBattledOnly(!showBattledOnly)}
        >
          With battle data
        </button>
        <div className="prod-view-toggle prod-view-toggle--desktop" role="group" aria-label="View mode">
          <button
            type="button"
            className={`prod-view-btn${viewMode === 'grid' ? ' prod-view-btn-on' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            aria-label="Grid view"
          >
            ⊞
          </button>
          <button
            type="button"
            className={`prod-view-btn${viewMode === 'list' ? ' prod-view-btn-on' : ''}`}
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            aria-label="List view"
          >
            ☰
          </button>
        </div>
      </div>

      {loadingPortfolio ? (
        <div style={{ padding: '60px 0', fontSize: 14, color: 'var(--ink-30)' }}>Loading your products…</div>
      ) : null}

      {!loadingPortfolio && filtered.length === 0 ? (
        <div className="cat-browse-empty">
          <div className="cat-browse-empty-title">
            {search ? 'No products found' : 'No products in this portfolio yet.'}
          </div>
          {search ? (
            <p className="cat-browse-empty-sub">Try another product name.</p>
          ) : null}
        </div>
      ) : null}

      {!loadingPortfolio && filtered.length > 0 ? (
        <div className="prod-phone-list" aria-label="Products">
          {filtered.map((product) => (
            <PhoneProductRow key={product.product_id} product={product} />
          ))}
        </div>
      ) : null}

      {!loadingPortfolio && filtered.length > 0 && viewMode === 'grid' ? (
        <div className="prod-desktop-views cat-tile-grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              summary={facetById[product.product_id]}
            />
          ))}
        </div>
      ) : null}

      {!loadingPortfolio && filtered.length > 0 && viewMode === 'list' ? (
        <div className="prod-desktop-views prod-list">
          <div className="prod-list-head">
            <span />
            <span>Product</span>
            <span className="prod-list-hide-narrow">Barcode</span>
            <span className="prod-list-hide-narrow">Attributes</span>
            <span style={{ textAlign: 'right' }}>Battles</span>
            <span style={{ textAlign: 'right' }}> </span>
          </div>
          {filtered.map((product) => {
            const isClaimed = claimedIdSet.has(product.product_id)
            const summary = facetById[product.product_id]
            const href = `/products/${product.product_id}`
            return (
              <div key={product.product_id} className="prod-list-row prod-list-row--split">
                <Link href={href} className="prod-list-row__main">
                  <ProductThumb name={product.product_name_clean} imageUrl={product.image_url} />
                  <div className="prod-list-row__identity">
                    <div className="prod-list-row__name">{product.product_name_clean}</div>
                    {product.package_size_value ? (
                      <div className="prod-list-row__sub">
                        {product.package_size_value} {product.package_size_uom}
                      </div>
                    ) : null}
                  </div>
                  <div className="prod-list-hide-narrow prod-list-row__barcode">
                    {product.primary_barcode ?? '—'}
                  </div>
                </Link>
                <div className="prod-list-hide-narrow" style={{ minWidth: 0 }}>
                  {summary ? (
                    <Link
                      href={`/products/${product.product_id}?tab=facets`}
                      className="pf-list-facet"
                    >
                      <span>
                        {summary.derived_count} from Dough
                        {summary.declared_count > 0 ? (
                          <>
                            {' · '}
                            <span className="pf-list-facet__added">
                              {summary.declared_count} added
                            </span>
                          </>
                        ) : null}
                        {' · '}
                        {Math.max(0, summary.declarable_total - summary.declarable_filled)} to add
                      </span>
                      {summary.pending_count > 0 ? (
                        <span className="pf-list-facet__pending">
                          {summary.pending_count} pending
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
                    color: product.total_battles > 0 ? 'var(--sage-dark)' : 'var(--ink-30)',
                  }}
                >
                  {product.total_battles > 0 ? n(product.total_battles) : '—'}
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
      ) : null}
    </div>
  )
}
