'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  formatStandingRank,
  getBrandProductCategoryStanding,
  parseBrandProductCategoryStanding,
  ProductStandingError,
  type BrandProductCategoryStanding,
  type ProductCategoryStandingRow,
  type StandingConfidence,
} from '@/lib/brandHome/productCategoryStanding'

function confidenceChip(confidence: StandingConfidence | null) {
  if (!confidence || confidence === 'INSUFFICIENT') return null
  const tone =
    confidence === 'HIGH'
      ? { color: 'var(--sage)', bg: 'var(--sage-soft, rgba(74,124,89,0.14))' }
      : confidence === 'MEDIUM'
        ? { color: 'var(--ink-50)', bg: 'var(--surface-1)' }
        : { color: 'var(--amber, #a66a14)', bg: 'var(--amber-pale, rgba(192,120,24,0.12))' }
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: tone.color,
        background: tone.bg,
        padding: '2px 7px',
        borderRadius: 4,
      }}
    >
      {confidence.toLowerCase()} confidence
    </span>
  )
}

function EmptyStanding({ productCount }: { productCount: number }) {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        padding: '28px 28px 24px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 10,
        }}
      >
        Category standing
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        Category standings are still building
      </h3>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-50)',
          lineHeight: 1.55,
          margin: '0 0 12px',
          maxWidth: 520,
        }}
      >
        Your products are on Dough. As consumers compare products they’ve tried, product-level
        standings will appear here.
      </p>
      {productCount > 0 ? (
        <p style={{ fontSize: 12, color: 'var(--ink-30)', margin: '0 0 16px' }}>
          {productCount.toLocaleString()} product{productCount === 1 ? '' : 's'} on Dough, gathering
          signal.
        </p>
      ) : null}
      <Link
        href="/products"
        style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}
      >
        See all products →
      </Link>
    </div>
  )
}

function StandingRow({ product }: { product: ProductCategoryStandingRow }) {
  const standing = formatStandingRank(product.rank_in_pool, product.pool_size)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 0',
        borderTop: '1px solid var(--mist, var(--ink-10))',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
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
          {product.product_name}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {standing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 15,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}
            >
              {standing}
            </span>
            {confidenceChip(product.confidence)}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--ink-30)', fontStyle: 'italic' }}>
            Still gathering signal
          </span>
        )}
      </div>
    </div>
  )
}

function PopulatedStanding({ data }: { data: BrandProductCategoryStanding }) {
  const headline = data.headline
  const headlineStanding =
    headline && headline.has_standing
      ? formatStandingRank(headline.rank_in_pool, headline.pool_size)
      : null
  const withStanding = data.products.filter((p) => p.has_standing)
  const withoutStanding = data.products.filter((p) => !p.has_standing)

  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        padding: '28px 28px 20px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 10,
        }}
      >
        Your top product’s standing
      </div>

      {headline && headlineStanding ? (
        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 400,
              color: 'var(--ink)',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              maxWidth: 640,
            }}
          >
            {headline.product_name} ranks {headlineStanding} in its category
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {confidenceChip(headline.confidence)}
          </div>
        </div>
      ) : null}

      {withStanding.length > 0 ? (
        <div style={{ marginBottom: withoutStanding.length ? 8 : 0 }}>
          {withStanding.map((p) => (
            <StandingRow key={p.product_id} product={p} />
          ))}
        </div>
      ) : null}

      {withoutStanding.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 4,
              paddingTop: 8,
            }}
          >
            Still gathering signal
          </div>
          {withoutStanding.slice(0, 8).map((p) => (
            <StandingRow key={p.product_id} product={p} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Honest product/category standing. Empty path is primary until battle-backed Elo exists.
 * Optional `__stub` for local verification only — never commit with stub data.
 */
export default function ProductCategoryStandingCard({
  catalogProductCount = 0,
  __stub,
}: {
  catalogProductCount?: number
  /** Local verification only — never commit with stub data. */
  __stub?: BrandProductCategoryStanding | null
}) {
  const [data, setData] = useState<BrandProductCategoryStanding | null>(__stub ?? null)
  const [ready, setReady] = useState(Boolean(__stub))
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    if (__stub) {
      setData(__stub)
      setReady(true)
      setSessionError(null)
      return
    }
    let cancelled = false
    void getBrandProductCategoryStanding()
      .then((payload) => {
        if (!cancelled) {
          setData(payload)
          setSessionError(null)
          setReady(true)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ProductStandingError && err.code === 'no_effective_brand') {
          setSessionError(err.message)
          setData(null)
          setReady(true)
          return
        }
        // Generic failure → honest empty, never stale/fake numbers
        setSessionError(null)
        setData(parseBrandProductCategoryStanding(null))
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [__stub])

  if (!ready) {
    return (
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 12,
          padding: '28px',
          minHeight: 120,
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>Loading standings…</div>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 12,
          padding: '28px 28px 24px',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 8px',
          }}
        >
          Couldn’t load standings
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, margin: 0 }}>
          {sessionError}
        </p>
      </div>
    )
  }

  if (!data || !data.has_any_standing) {
    return <EmptyStanding productCount={catalogProductCount || data?.products.length || 0} />
  }

  return <PopulatedStanding data={data} />
}
