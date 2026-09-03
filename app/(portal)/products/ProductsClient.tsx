'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { PortalUser, Brand, BrandSubscription, BrandProduct } from '@/lib/queries'
import { ProductArt } from '@/components/products/ProductArt'
import '@/components/categories/categoriesPage.css'
import '@/components/products/productTile.css'
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

function ProductCard({ product }: { product: PortfolioProduct }) {
  const href = `/products/${product.product_id}`
  const category = product.l3_name ?? product.l2_name
  return (
    <Link href={href} className="cat-tile">
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
        if (rows.length > 0) {
          setPortfolioProducts(rows)
          setUsingFallback(false)
        } else {
          setPortfolioProducts(
            serverProducts.map((p) => ({
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
          )
          setUsingFallback(true)
        }
        setLoadingPortfolio(false)
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
        <div className="prod-view-toggle" role="group" aria-label="View mode">
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

      {!loadingPortfolio && viewMode === 'grid' ? (
        filtered.length === 0 ? (
          <div className="cat-browse-empty">
            <div className="cat-browse-empty-title">
              {search ? 'No products found' : 'No products in this portfolio yet.'}
            </div>
            {search ? (
              <p className="cat-browse-empty-sub">Try another product name.</p>
            ) : null}
          </div>
        ) : (
          <div className="cat-tile-grid">
            {filtered.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )
      ) : null}

      {!loadingPortfolio && viewMode === 'list' ? (
        filtered.length === 0 ? (
          <div className="cat-browse-empty">
            <div className="cat-browse-empty-title">
              {search ? 'No products found' : 'No products in this portfolio yet.'}
            </div>
          </div>
        ) : (
          <div className="prod-list">
            <div className="prod-list-head">
              <span />
              <span>Product</span>
              <span className="prod-list-hide-narrow">Barcode</span>
              <span className="prod-list-hide-narrow">Category</span>
              <span style={{ textAlign: 'right' }}>Battles</span>
              <span style={{ textAlign: 'right' }}> </span>
            </div>
            {filtered.map((product) => {
              const isClaimed = claimedIdSet.has(product.product_id)
              return (
                <Link
                  key={product.product_id}
                  href={`/products/${product.product_id}`}
                  className="prod-list-row"
                >
                  <div className="prod-list-thumb">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt="" />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--ink-30)' }}>
                        {(product.product_name_clean[0] || '?').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.product_name_clean}
                    </div>
                    {product.package_size_value ? (
                      <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 1 }}>
                        {product.package_size_value} {product.package_size_uom}
                      </div>
                    ) : null}
                  </div>
                  <div
                    className="prod-list-hide-narrow"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-30)',
                      fontFamily: 'var(--font-mono, monospace)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.primary_barcode ?? '—'}
                  </div>
                  <div
                    className="prod-list-hide-narrow"
                    style={{
                      fontSize: 13,
                      color: 'var(--ink-50)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.l3_name ?? product.l2_name ?? '—'}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      textAlign: 'right',
                      color: product.total_battles > 0 ? 'var(--sage-dark)' : 'var(--ink-30)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {product.total_battles > 0 ? n(product.total_battles) : '—'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`cat-chip ${isClaimed ? 'cat-chip-live' : 'cat-chip-empty'}`}
                      style={{ justifySelf: 'end' }}
                    >
                      {isClaimed ? 'Active' : 'Not claimed'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      ) : null}
    </div>
  )
}
