'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  getBrandCategoryLauncher,
  parseBrandCategoryLauncher,
  competeCategoriesFromLauncher,
  CategoryLauncherError,
  type BrandCategoryLauncher,
  type CategoryLauncherRow,
} from '@/lib/categoryLauncher'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import BannerArt from '@/components/categories/BannerArt'
import type { AdjacentCategory } from '@/lib/adjacentCategories'
import '@/components/categories/categoriesPage.css'

const SEARCH_DEBOUNCE_MS = 280

function n(value: number): string {
  return Math.max(0, Math.trunc(value)).toLocaleString()
}

function uniqueL1Count(rows: CategoryLauncherRow[]): number {
  const names = new Set<string>()
  for (const row of rows) {
    if (row.l1_name) names.add(row.l1_name)
  }
  return names.size
}

function competeStatus(row: CategoryLauncherRow): 'live' | 'building' | 'empty' {
  if (row.entitled) return 'live'
  if (row.total_battles > 0) return 'building'
  return 'empty'
}

function StatusChip({ status }: { status: 'live' | 'building' | 'empty' }) {
  const label =
    status === 'live' ? 'Live dashboard' : status === 'building' ? 'Building signal' : 'No battles yet'
  return (
    <span className={`cat-chip cat-chip-${status}`}>
      <span className="cat-chip-dot" aria-hidden />
      {label}
    </span>
  )
}

function MetricCells({
  row,
  size,
}: {
  row: CategoryLauncherRow
  size: 'lg' | 'sm'
}) {
  const items = [
    { value: row.total_products, label: 'Products' },
    { value: row.products_with_battles, label: 'Products with battles' },
    { value: row.total_battles, label: size === 'lg' ? 'Total battles' : 'Battles' },
  ]
  return (
    <div className={`cat-metrics${size === 'sm' ? ' cat-metrics-sm' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="cat-metric">
          <div className={`cat-metric-n ${size === 'lg' ? 'cat-metric-n-lg' : 'cat-metric-n-sm'}`}>
            {n(item.value)}
          </div>
          <div className="cat-metric-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function SectionHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="cat-section-head">
      <h2 className="cat-section-title">{title}</h2>
      {typeof sub === 'string' ? <p className="cat-section-sub">{sub}</p> : sub}
    </div>
  )
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

function OwnedEmpty() {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--mist)',
        borderRadius: 13,
        padding: '32px 28px 28px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--sage-dark)',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        You haven’t unlocked any category dashboards yet
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-50)',
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 520,
        }}
      >
        Below are the categories where your products already compete on Dough. Unlock a dashboard
        when you’re ready for the full Overview — standings stay honest until then.
      </p>
    </div>
  )
}

function OwnedCard({ row }: { row: CategoryLauncherRow }) {
  const href = brandCategoryOverviewHref(row.l2_id)
  return (
    <div className="cat-feature">
      <div className="cat-feature-art">
        {row.banner_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.banner_image_url} alt="" />
        ) : (
          <div className="cat-feature-art-fallback" aria-hidden>
            {(row.icon_name || row.l2_name).slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="cat-feature-body">
        <div className="cat-feature-top">
          <div>
            {row.l1_name ? <div className="cat-kicker">{row.l1_name}</div> : null}
            <h3 className="cat-feature-name">{row.l2_name}</h3>
          </div>
          <StatusChip status="live" />
        </div>
        <MetricCells row={row} size="lg" />
        <div className="cat-feature-actions">
          <Link href={href} className="cat-primary-cta">
            Open overview →
          </Link>
        </div>
      </div>
    </div>
  )
}

function CompeteCard({ row }: { row: CategoryLauncherRow }) {
  const status = competeStatus(row)
  const href = brandCategoryOverviewHref(row.l2_id)
  const cta = status === 'live' ? 'Open overview' : 'View category'
  return (
    <Link href={href} className="cat-tile">
      <BannerArt row={row} height={152} />
      <div className="cat-tile-body">
        {row.l1_name ? <div className="cat-kicker">{row.l1_name}</div> : null}
        <div className="cat-tile-name">{row.l2_name}</div>
        <div className="cat-tile-chip-row">
          <StatusChip status={status} />
        </div>
        <div className="cat-tile-metrics">
          <MetricCells row={row} size="sm" />
        </div>
      </div>
      <div className="cat-tile-action">
        <span className="cat-tile-btn cat-tile-btn-solid">{cta}</span>
      </div>
    </Link>
  )
}

function ExploreCard({
  row,
}: {
  row: {
    l2_id: number
    l2_name: string
    l1_name: string | null
    banner_image_url: string | null
    icon_name: string | null
  }
}) {
  return (
    <Link href={brandCategoryOverviewHref(row.l2_id)} className="cat-tile">
      <BannerArt row={row} height={152} />
      <div className="cat-tile-body">
        {row.l1_name ? <div className="cat-kicker">{row.l1_name}</div> : null}
        <div className="cat-tile-name">{row.l2_name}</div>
      </div>
      <div className="cat-tile-action">
        <span className="cat-tile-btn cat-tile-btn-outline">Explore</span>
      </div>
    </Link>
  )
}

export default function CategoryLauncher({
  brandName,
  adjacentCategories,
}: {
  brandName: string
  adjacentCategories: AdjacentCategory[]
}) {
  const [data, setData] = useState<BrandCategoryLauncher | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const baselineRef = useRef<BrandCategoryLauncher | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    void getBrandCategoryLauncher(debouncedSearch || null)
      .then((payload) => {
        if (cancelled) return
        if (!debouncedSearch) {
          baselineRef.current = payload
          setData(payload)
        } else {
          const base = baselineRef.current
          setData({
            owned: base?.owned ?? payload.owned,
            has_products: base?.has_products ?? payload.has_products,
            browse: payload.browse,
            search: payload.search,
          })
        }
        setError(null)
        setReady(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof CategoryLauncherError && err.code === 'no_effective_brand') {
          setError(err.message)
          setData(null)
          setReady(true)
          return
        }
        setError(null)
        setData(parseBrandCategoryLauncher(null))
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  if (!ready) {
    return (
      <div style={{ padding: '24px 0', fontSize: 14, color: 'var(--ink-30)' }}>
        Loading categories…
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--mist)',
          borderRadius: 13,
          padding: '28px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 400,
            margin: '0 0 8px',
            color: 'var(--sage-dark)',
          }}
        >
          Couldn’t load categories
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55 }}>{error}</p>
      </div>
    )
  }

  const owned = data?.owned ?? []
  const hasProducts = data?.has_products ?? []
  const browse = data?.browse ?? []
  const compete = data ? competeCategoriesFromLauncher(data) : []
  const represented = compete.length
  const departments = uniqueL1Count(compete)
  const productsMapped = compete.reduce((s, r) => s + (r.total_products || 0), 0)
  const battlesCaptured = compete.reduce((s, r) => s + (r.total_battles || 0), 0)

  return (
    <div>
      <header className="cat-header">
        <div className="cat-header-copy">
          <div className="cat-eyebrow">{brandName}</div>
          <h1 className="cat-title">Categories</h1>
          <p className="cat-lede">
            Category dashboards unlock full Overview. Until then, see where your products already
            compete — honest product and battle counts, no invented rankings.
          </p>
        </div>
      </header>

      <div className="cat-summary">
        <SummaryCard
          label="Categories represented"
          value={represented}
          hint={departments > 0 ? `Across ${departments} department${departments === 1 ? '' : 's'}` : 'No competing categories yet'}
          icon="M4 6h16M4 12h16M4 18h10"
        />
        <SummaryCard
          label="Dashboards unlocked"
          value={owned.length}
          hint={owned.length === 0 ? 'None live yet' : owned.length === 1 ? '1 live overview' : `${owned.length} live overviews`}
          icon="M4 19V5h12v14H4zM16 8h4v11h-4"
        />
        <SummaryCard
          label="Products mapped"
          value={productsMapped}
          hint="In competing categories"
          icon="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        />
        <SummaryCard
          label="Battles captured"
          value={battlesCaptured}
          hint="Across competing categories"
          icon="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"
        />
      </div>

      <section className="cat-section">
        <SectionHead
          title="Ready to explore"
          sub="Dashboards that are live and ready with enough battle signal."
        />
        {owned.length === 0 ? (
          <OwnedEmpty />
        ) : (
          owned.map((row) => <OwnedCard key={row.l2_id} row={row} />)
        )}
      </section>

      <section className="cat-section">
        <SectionHead
          title="Where you compete"
          sub="These categories are building signal. Dashboards will unlock as battles accumulate."
        />
        {hasProducts.length === 0 ? (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--mist)',
              borderRadius: 13,
              padding: '28px 24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 400,
                margin: '0 0 8px',
                color: 'var(--sage-dark)',
              }}
            >
              No competing categories yet
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, margin: '0 0 16px' }}>
              Claim products under Products. Once they sit in a taxonomy category, they appear here.
            </p>
            <Link href="/products" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sage)', textDecoration: 'none' }}>
              Go to Products →
            </Link>
          </div>
        ) : (
          <div className="cat-tile-grid">
            {hasProducts.map((row) => (
              <CompeteCard key={row.l2_id} row={row} />
            ))}
          </div>
        )}
      </section>

      {adjacentCategories.length > 0 ? (
        <section className="cat-section">
          <SectionHead title="Categories next door" sub="Adjacent aisles you’re not in yet." />
          <div className="cat-tile-grid">
            {adjacentCategories.map((row) => (
              <ExploreCard key={row.l2_id} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="cat-section">
        <SectionHead
          title="Browse categories"
          sub={
            <>
              <p className="cat-section-sub">Explore categories beyond your current portfolio.</p>
              <p className="cat-section-sub">
                You don’t have products here yet — but you can add them anytime.
              </p>
            </>
          }
        />
        <div className="cat-browse-search-wrap">
          <svg className="cat-browse-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            className="cat-browse-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search categories or parents…"
            aria-label="Search browse categories"
          />
        </div>
        {browse.length === 0 ? (
          <div className="cat-browse-empty">
            <div className="cat-browse-empty-title">
              {debouncedSearch ? 'No categories found' : 'No other categories to browse right now.'}
            </div>
            {debouncedSearch ? (
              <p className="cat-browse-empty-sub">Try another category or parent name.</p>
            ) : null}
          </div>
        ) : (
          <div className="cat-tile-grid">
            {browse.map((row) => (
              <ExploreCard key={row.l2_id} row={row} />
            ))}
          </div>
        )}
      </section>

      <div className="cat-note">
        <div className="cat-note-icon" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <span>
          Dashboards unlock as products collect enough battle activity. We’ll surface them here
          automatically.
        </span>
      </div>
    </div>
  )
}
