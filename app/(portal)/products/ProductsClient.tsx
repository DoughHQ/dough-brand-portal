'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Brand } from '@/lib/queries'
import { ProductArt } from '@/components/products/ProductArt'
import { fetchProductFacetSummaries } from '@/lib/facets/api'
import {
  facetFooterParts,
  type FacetSummaryRow,
} from '@/lib/facets/productFacets'
import { formatUtcStamp } from '@/lib/portal-ui/format'
import type {
  BrandCatalogSummary,
  BrandProductPageCursor,
  BrandProductPageItem,
} from '@/lib/brandHome/parseBrandProductPage'
import { parseBrandProductPage } from '@/lib/brandHome/parseBrandProductPage'
import '@/components/categories/categoriesPage.css'
import '@/components/products/productTile.css'
import '@/components/products/productFacets.css'
import './productsPage.css'

interface ProductsClientProps {
  brand: Brand
  isImpersonating?: boolean
  summary: BrandCatalogSummary | null
  initialItems: BrandProductPageItem[]
  initialHasMore: boolean
  initialCursor: BrandProductPageCursor | null
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

function PhoneProductRow({ product }: { product: BrandProductPageItem }) {
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

function ProductCard({
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

async function fetchPage(opts: {
  cursor: BrandProductPageCursor | null
  battledOnly: boolean
  search: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('list_brand_products_page' as never, {
    p_limit: 50,
    p_cursor_battles: opts.cursor?.totalBattles ?? null,
    p_cursor_product_id: opts.cursor?.productId ?? null,
    p_battled_only: opts.battledOnly,
    p_search: opts.search.trim() || null,
  } as never)
  if (error) throw new Error(error.message)
  const page = parseBrandProductPage(data)
  if (!page) throw new Error('Could not parse products page')
  return page
}

export default function ProductsClient({
  brand,
  isImpersonating,
  summary,
  initialItems,
  initialHasMore,
  initialCursor,
}: ProductsClientProps) {
  const [items, setItems] = useState<BrandProductPageItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<BrandProductPageCursor | null>(initialCursor)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showBattledOnly, setShowBattledOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [facetById, setFacetById] = useState<Record<number, FacetSummaryRow>>({})
  const [facetError, setFacetError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isPending, startTransition] = useTransition()
  const skipInitialFilterFetch = useRef(true)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(t)
  }, [search])

  const loadFacetSummaries = useCallback(async (products: BrandProductPageItem[]) => {
    const ids = products.map((p) => p.productId)
    if (ids.length === 0) {
      setFacetById({})
      return
    }
    const supabase = createClient()
    const { rows, error } = await fetchProductFacetSummaries(supabase, ids)
    if (error) setFacetError(error)
    else setFacetError(null)
    setFacetById((prev) => {
      const next = { ...prev }
      for (const row of rows) next[row.product_id] = row
      return next
    })
  }, [])

  useEffect(() => {
    void loadFacetSummaries(initialItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false
      if (!debouncedSearch && !showBattledOnly) return
    }
    let cancelled = false
    startTransition(() => {
      void (async () => {
        try {
          const page = await fetchPage({
            cursor: null,
            battledOnly: showBattledOnly,
            search: debouncedSearch,
          })
          if (cancelled) return
          setItems(page.items)
          setHasMore(page.hasMore)
          setCursor(page.nextCursor)
          setListError(null)
          setFacetById({})
          void loadFacetSummaries(page.items)
        } catch (err) {
          if (cancelled) return
          setListError(err instanceof Error ? err.message : String(err))
        }
      })()
    })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, showBattledOnly, loadFacetSummaries])

  async function loadMore() {
    if (!hasMore || !cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await fetchPage({
        cursor,
        battledOnly: showBattledOnly,
        search: debouncedSearch,
      })
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.productId))
        const merged = [...prev]
        for (const item of page.items) {
          if (!seen.has(item.productId)) merged.push(item)
        }
        return merged
      })
      setHasMore(page.hasMore)
      setCursor(page.nextCursor)
      void loadFacetSummaries(page.items)
      setListError(null)
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingMore(false)
    }
  }

  const productCount = summary?.productCount ?? items.length
  const battledCount = summary?.battledCount ?? items.filter((p) => p.hasBattleData).length
  const categoryCount = summary?.categoryCount ?? 0
  const claimedCount = summary?.claimedSkuCount ?? 0
  const unclaimedCount = Math.max(0, productCount - claimedCount)

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
        <div className="prod-header-actions">
          <button type="button" className="cat-primary-cta" onClick={() => alert('Add product coming soon')}>
            + Add product
          </button>
        </div>
      </header>

      <div className="cat-summary">
        <SummaryCard
          label="Products"
          value={productCount}
          hint="In your catalog"
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
          hint="Across your catalog"
          icon="M4 6h16M4 12h16M4 18h10"
        />
        <SummaryCard
          label="Claimed on plan"
          value={claimedCount}
          hint={
            unclaimedCount > 0
              ? `${n(unclaimedCount)} in catalog still unclaimed`
              : productCount > 0
                ? 'All catalog products claimed'
                : 'No catalog products yet'
          }
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
                        {summaryRow.derived_count} from Dough
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
                    color: product.totalBattles > 0 ? 'var(--sage-dark)' : 'var(--ink-30)',
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
      ) : null}

      {hasMore ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 8px' }}>
          <button
            type="button"
            className="cat-primary-cta"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            style={{ opacity: loadingMore ? 0.6 : 1 }}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
