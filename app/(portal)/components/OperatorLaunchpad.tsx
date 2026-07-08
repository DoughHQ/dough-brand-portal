'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { BrandSearchResult, AdminProductSearchResult } from '@/lib/queries'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'

type SearchTab = 'products' | 'brands'

interface Props {
  /** compact = studies page embed; full = dashboard hero */
  variant?: 'full' | 'compact'
}

function formatBattles(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n > 0 ? String(n) : '—'
}

function categoryLabel(p: AdminProductSearchResult): string {
  return p.l3_name ?? p.l2_name ?? 'Uncategorized'
}

export default function OperatorLaunchpad({ variant = 'full' }: Props) {
  const router = useRouter()
  const { enterAsBrand, loading: entering } = useEnterImpersonation()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTab>('products')
  const [searching, setSearching] = useState(false)
  const [products, setProducts] = useState<AdminProductSearchResult[]>([])
  const [brands, setBrands] = useState<BrandSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (variant === 'full') inputRef.current?.focus()
  }, [variant])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setProducts([])
      setBrands([])
      setHasSearched(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      setHasSearched(true)
      try {
        if (tab === 'products') {
          const { data } = await supabase.rpc('search_products_admin', { p_query: trimmed })
          setProducts((data ?? []) as AdminProductSearchResult[])
        } else {
          const { data } = await supabase.rpc('search_brands_admin', { p_query: trimmed })
          setBrands(
            ((data ?? []) as BrandSearchResult[]).map((r) => ({
              brand_id: r.brand_id,
              brand_name: r.brand_name,
              product_count: Number(r.product_count),
              battle_count: Number(r.battle_count),
              top_elo: r.top_elo ? Number(r.top_elo) : null,
            }))
          )
        }
      } finally {
        setSearching(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [query, tab, supabase])

  function startCommission(brandId: number, productId?: number) {
    const params = new URLSearchParams({ brandId: String(brandId) })
    if (productId != null) params.set('productId', String(productId))
    router.push(`/admin/studies/new?${params.toString()}`)
  }

  const results = tab === 'products' ? products : brands
  const showEmpty = hasSearched && !searching && results.length === 0

  return (
    <section
      style={{
        background: variant === 'full' ? 'var(--white)' : 'transparent',
        border: variant === 'full' ? '1px solid var(--ink-10)' : 'none',
        borderRadius: variant === 'full' ? 'var(--r-lg)' : 0,
        overflow: 'hidden',
        marginBottom: variant === 'full' ? 40 : 0,
      }}
    >
      <div style={{ padding: variant === 'full' ? '28px 28px 24px' : '0 0 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 8,
            }}
          >
            Operator
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: variant === 'full' ? 30 : 24,
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
              lineHeight: 1.15,
            }}
          >
            Launch a study
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
            Find any product or brand in the catalog. Commission a study without leaving operator mode — no impersonation required.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {(['products', 'brands'] as const).map((key) => {
            const active = tab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: active ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
                  background: active ? 'var(--sage-pale)' : 'var(--white)',
                  color: active ? 'var(--sage)' : 'var(--ink-50)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'capitalize',
                }}
              >
                {key}
              </button>
            )
          })}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'products' ? 'Search products or brands…' : 'Search brands…'}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '14px 16px 14px 42px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--ink-10)',
              background: 'var(--surface-1)',
              fontSize: 15,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sage)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--ink-10)' }}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="7" cy="7" r="4.5" stroke="var(--ink-30)" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="var(--ink-30)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {searching && (
            <span
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 11,
                color: 'var(--ink-30)',
              }}
            >
              Searching…
            </span>
          )}
        </div>
      </div>

      {(results.length > 0 || showEmpty) && (
        <div style={{ borderTop: '1px solid var(--ink-10)' }}>
          {showEmpty ? (
            <div style={{ padding: '32px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--ink-50)', marginBottom: 4 }}>No matches</div>
              <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>Try a different spelling or search the other tab.</div>
            </div>
          ) : tab === 'products' ? (
            products.map((product, i) => (
              <div
                key={product.product_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 20,
                  alignItems: 'center',
                  padding: '16px 28px',
                  borderBottom: i < products.length - 1 ? '1px solid var(--ink-10)' : 'none',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 4,
                    }}
                  >
                    {product.product_name_clean}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: 12, color: 'var(--ink-50)' }}>
                    <span>{product.brand_name}</span>
                    <span style={{ color: 'var(--ink-20)' }}>·</span>
                    <span>{categoryLabel(product)}</span>
                    <span style={{ color: 'var(--ink-20)' }}>·</span>
                    <span>{formatBattles(product.battles_total)} battles</span>
                    {product.elo_score != null && (
                      <>
                        <span style={{ color: 'var(--ink-20)' }}>·</span>
                        <span>ELO {Math.round(product.elo_score)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => startCommission(product.brand_id, product.product_id)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--sage)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Create study
                  </button>
                  <button
                    type="button"
                    disabled={entering}
                    onClick={() => void enterAsBrand(product.brand_id, '/dashboard')}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      color: 'var(--ink-50)',
                      border: '1px solid var(--ink-10)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: entering ? 'default' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View as brand
                  </button>
                </div>
              </div>
            ))
          ) : (
            brands.map((brand, i) => (
              <div
                key={brand.brand_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 20,
                  alignItems: 'center',
                  padding: '16px 28px',
                  borderBottom: i < brands.length - 1 ? '1px solid var(--ink-10)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                    {brand.brand_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                    {brand.product_count.toLocaleString()} products
                    <span style={{ color: 'var(--ink-20)', margin: '0 8px' }}>·</span>
                    {formatBattles(brand.battle_count)} battles
                    {brand.top_elo != null && (
                      <>
                        <span style={{ color: 'var(--ink-20)', margin: '0 8px' }}>·</span>
                        Top ELO {Math.round(brand.top_elo)}
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => startCommission(brand.brand_id)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--sage)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Create study
                  </button>
                  <button
                    type="button"
                    disabled={entering}
                    onClick={() => void enterAsBrand(brand.brand_id, '/dashboard')}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      color: 'var(--ink-50)',
                      border: '1px solid var(--ink-10)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: entering ? 'default' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View as brand
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!hasSearched && query.trim().length < 2 && (
        <div
          style={{
            borderTop: variant === 'full' ? '1px solid var(--ink-10)' : 'none',
            padding: variant === 'full' ? '20px 28px' : '8px 0 0',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.5 }}>
            Type at least 2 characters. Search across {tab === 'products' ? '552k+ products' : '40k+ brands'} in the catalog.
          </div>
        </div>
      )}
    </section>
  )
}
