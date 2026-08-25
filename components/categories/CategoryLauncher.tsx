'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  formatCompeteCounts,
  getBrandCategoryLauncher,
  parseBrandCategoryLauncher,
  CategoryLauncherError,
  type BrandCategoryLauncher,
  type CategoryLauncherRow,
} from '@/lib/categoryLauncher'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'

const SEARCH_DEBOUNCE_MS = 280

function sectionLabel(text: string) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-30)',
        marginBottom: 12,
      }}
    >
      {text}
    </div>
  )
}

function BannerArt({
  row,
  tall,
}: {
  row: CategoryLauncherRow
  tall?: boolean
}) {
  const h = tall ? 140 : 88
  if (row.banner_image_url) {
    return (
      <div
        style={{
          height: h,
          borderRadius: tall ? '10px 10px 0 0' : 8,
          overflow: 'hidden',
          background: 'var(--surface-1)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.banner_image_url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }
  return (
    <div
      style={{
        height: h,
        borderRadius: tall ? '10px 10px 0 0' : 8,
        background:
          'linear-gradient(145deg, var(--surface-1) 0%, var(--mist, #e8e4dc) 100%)',
        display: 'grid',
        placeItems: 'center',
      }}
      aria-hidden
    >
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: tall ? 28 : 22,
          color: 'var(--ink-30)',
          letterSpacing: '-0.02em',
        }}
      >
        {(row.icon_name || row.l2_name).slice(0, 1).toUpperCase()}
      </span>
    </div>
  )
}

function UnlockCta({ subtle }: { subtle?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 500,
        color: subtle ? 'var(--ink-30)' : 'var(--ink-50)',
        cursor: 'not-allowed',
        userSelect: 'none',
      }}
      title="Category dashboard unlocks aren’t available yet"
      aria-disabled
    >
      Unlock dashboard
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Soon
      </span>
    </span>
  )
}

function OpenOverviewCta({ href }: { href: string }) {
  return (
    <Link
      href={href}
      style={{ fontSize: 12, fontWeight: 500, color: 'var(--sage)', textDecoration: 'none' }}
    >
      Open Overview →
    </Link>
  )
}

function OwnedEmpty() {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        padding: '32px 28px 28px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--ink)',
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
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <BannerArt row={row} tall />
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {row.l1_name ? (
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>{row.l1_name}</div>
        ) : null}
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
            lineHeight: 1.25,
          }}
        >
          {row.l2_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.45, marginBottom: 14 }}>
          {formatCompeteCounts(row)}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <OpenOverviewCta href={href} />
        </div>
      </div>
    </div>
  )
}

function CompeteCard({ row }: { row: CategoryLauncherRow }) {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <BannerArt row={row} />
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {row.l1_name ? (
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>{row.l1_name}</div>
        ) : null}
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
          {row.l2_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.45, marginBottom: 14 }}>
          {formatCompeteCounts(row)}
        </div>
        <div style={{ marginTop: 'auto' }}>
          {row.entitled ? (
            <OpenOverviewCta href={brandCategoryOverviewHref(row.l2_id)} />
          ) : (
            <UnlockCta />
          )}
        </div>
      </div>
    </div>
  )
}

function BrowseCard({ row }: { row: CategoryLauncherRow }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 0',
        borderTop: '1px solid var(--mist, var(--ink-10))',
      }}
    >
      <div style={{ width: 56, height: 40, flexShrink: 0, borderRadius: 6, overflow: 'hidden' }}>
        {row.banner_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.banner_image_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--surface-1)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: 'var(--ink-30)',
            }}
            aria-hidden
          >
            {(row.icon_name || row.l2_name).slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{row.l2_name}</div>
        {row.l1_name ? (
          <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>{row.l1_name}</div>
        ) : null}
      </div>
      <div style={{ flexShrink: 0 }}>
        {row.entitled ? (
          <OpenOverviewCta href={brandCategoryOverviewHref(row.l2_id)} />
        ) : (
          <UnlockCta subtle />
        )}
      </div>
    </div>
  )
}

export default function CategoryLauncher({ brandName }: { brandName: string }) {
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
          // Keep owned / has_products stable; only refresh browse from search response
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
          border: '1px solid var(--ink-10)',
          borderRadius: 12,
          padding: '28px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 400,
            margin: '0 0 8px',
            color: 'var(--ink)',
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

  return (
    <div>
      <header style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginBottom: 8,
          }}
        >
          {brandName}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 36,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 10px',
            letterSpacing: '-0.03em',
          }}
        >
          Categories
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55, maxWidth: 560 }}>
          Category dashboards unlock full Overview. Until then, see where your products already
          compete — honest product and battle counts, no invented rankings.
        </p>
      </header>

      <section style={{ marginBottom: 40 }}>
        {sectionLabel('Your dashboards')}
        {owned.length === 0 ? (
          <OwnedEmpty />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {owned.map((row) => (
              <OwnedCard key={row.l2_id} row={row} />
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        {sectionLabel('Where you compete')}
        {hasProducts.length === 0 ? (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 12,
              padding: '28px 24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 400,
                margin: '0 0 8px',
                color: 'var(--ink)',
              }}
            >
              No competing categories yet
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, margin: '0 0 16px' }}>
              Claim products under Products. Once they sit in a taxonomy category, they appear here.
            </p>
            <Link
              href="/products"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--sage)', textDecoration: 'none' }}
            >
              Go to Products →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 14,
            }}
          >
            {hasProducts.map((row) => (
              <CompeteCard key={row.l2_id} row={row} />
            ))}
          </div>
        )}
      </section>

      <section>
        {sectionLabel('Browse categories')}
        <div style={{ marginBottom: 16 }}>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search categories or parents…"
            aria-label="Search browse categories"
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '10px 14px',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              border: '1px solid var(--ink-10)',
              borderRadius: 8,
              background: 'var(--white)',
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
        </div>
        {browse.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-30)', margin: '8px 0 0' }}>
            {debouncedSearch
              ? `No categories match “${debouncedSearch}”.`
              : 'No other categories to browse right now.'}
          </p>
        ) : (
          <div>
            {browse.map((row) => (
              <BrowseCard key={row.l2_id} row={row} />
            ))}
            <div style={{ borderTop: '1px solid var(--mist, var(--ink-10))' }} />
          </div>
        )}
      </section>
    </div>
  )
}
