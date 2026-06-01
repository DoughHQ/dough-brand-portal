'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { PortalUser, Brand, BrandSubscription, BrandProduct } from '@/lib/queries'

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

export default function ProductsClient({
  brand,
  claimedIds,
  isImpersonating,
}: ProductsClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const [portfolioProducts, setPortfolioProducts] = useState<PortfolioProduct[]>([])
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [search, setSearch] = useState('')
  const [showBattledOnly, setShowBattledOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    supabase
      .rpc('get_brand_products_portfolio', { p_brand_id: brand.brand_id })
      .then(({ data, error }) => {
        if (error) console.error('portfolio error:', error)
        setPortfolioProducts((data ?? []) as PortfolioProduct[])
        setLoadingPortfolio(false)
      })
  }, [brand.brand_id])

  const claimedIdSet = new Set(claimedIds)
  const filtered = portfolioProducts.filter(p => {
    const matchSearch = !search || p.product_name_clean.toLowerCase().includes(search.toLowerCase())
    const matchBattled = !showBattledOnly || p.has_battle_data
    return matchSearch && matchBattled
  })
  const battledCount = portfolioProducts.filter(p => p.has_battle_data).length

  const brandQuery = isImpersonating ? `?brand_id=${brand.brand_id}` : ''

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      {isImpersonating && (
        <div style={{ background: 'var(--amber-pale)', border: '1px solid rgba(192,120,24,0.2)', borderRadius: 'var(--r-md)', padding: '10px 16px', marginBottom: 24, fontSize: 12, color: 'var(--amber)' }}>
          Viewing as {brand.brand_name} — this is exactly what they see.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
            Your products
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
            {portfolioProducts.length.toLocaleString()} products · {battledCount} with battle data
          </div>
        </div>
        <button
          onClick={() => alert('Add product coming soon')}
          style={{
            padding: '9px 18px',
            background: 'var(--sage)',
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 'var(--r-sm)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          + Add product
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
            background: 'var(--white)',
            fontSize: 13,
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--ink-30)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--ink-10)' }}
        />
        <button
          onClick={() => setShowBattledOnly(!showBattledOnly)}
          style={{
            padding: '9px 14px',
            borderRadius: 'var(--r-sm)',
            fontSize: 12,
            fontWeight: showBattledOnly ? 500 : 400,
            color: showBattledOnly ? 'var(--sage)' : 'var(--ink-50)',
            background: showBattledOnly ? 'var(--sage-pale)' : 'transparent',
            border: showBattledOnly ? '1px solid rgba(74,124,89,0.3)' : '1px solid var(--ink-10)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
          }}
        >
          With battle data
        </button>
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-1)', borderRadius: 'var(--r-sm)', padding: 3 }}>
          {(['grid', 'list'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 12,
                color: viewMode === mode ? 'var(--ink)' : 'var(--ink-50)',
                background: viewMode === mode ? 'var(--white)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {mode === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {loadingPortfolio && (
        <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-30)' }}>
          Loading your products...
        </div>
      )}

      {!loadingPortfolio && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filtered.map(product => {
            const isClaimed = claimedIdSet.has(product.product_id)
            return (
              <div
                key={product.product_id}
                onClick={() => router.push(`/products/${product.product_id}${brandQuery}`)}
                style={{
                  background: 'var(--white)',
                  border: `1px solid ${isClaimed ? 'var(--sage)' : 'var(--ink-10)'}`,
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{
                  height: 140,
                  background: 'var(--surface-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.product_name_clean}
                      style={{ maxHeight: 120, maxWidth: '90%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ fontSize: 32, fontWeight: 500, color: 'var(--ink-10)', fontFamily: 'var(--font-serif)' }}>
                      {product.product_name_clean[0]}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    {isClaimed && (
                      <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--sage)', background: 'white', border: '1px solid var(--sage)', borderRadius: 20, padding: '1px 7px' }}>
                        ACTIVE
                      </div>
                    )}
                    {product.has_battle_data && (
                      <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--ink-50)', background: 'white', border: '1px solid var(--ink-10)', borderRadius: 20, padding: '1px 7px' }}>
                        {product.total_battles} battles
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {product.product_name_clean}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 8 }}>
                    {product.l3_name ?? product.l2_name ?? ''}
                    {product.package_size_value ? ` · ${product.package_size_value}${product.package_size_uom ?? ''}` : ''}
                  </div>

                  {product.primary_barcode && (
                    <div style={{ fontSize: 10, color: 'var(--ink-30)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 8 }}>
                      {product.primary_barcode}
                    </div>
                  )}

                  {product.elo_score && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--ink-10)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>ELO</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 400, color: 'var(--ink)' }}>
                        {Math.round(Number(product.elo_score))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={e => {
                      e.stopPropagation()
                      router.push(`/products/${product.product_id}${brandQuery}`)
                    }}
                    style={{
                      width: '100%',
                      marginTop: 12,
                      padding: '7px 0',
                      background: isClaimed ? 'var(--sage-pale)' : 'var(--ink)',
                      color: isClaimed ? 'var(--sage)' : 'white',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 'var(--r-sm)',
                      border: isClaimed ? '1px solid rgba(74,124,89,0.2)' : 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {isClaimed ? 'View product' : 'Claim this product'}
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && !loadingPortfolio && (
            <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-30)' }}>
              {search ? `No products matching "${search}"` : 'No products found.'}
            </div>
          )}
        </div>
      )}

      {!loadingPortfolio && viewMode === 'list' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--ink-10)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 140px 120px 80px 80px 120px', padding: '8px 20px', background: 'var(--surface-1)', borderBottom: '1px solid var(--ink-10)' }}>
            {['', 'Product', 'Barcode', 'Category', 'Battles', 'ELO', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 4 ? 'right' : 'left' }}>
                {h}
              </div>
            ))}
          </div>
          {filtered.map((product, i) => {
            const isClaimed = claimedIdSet.has(product.product_id)
            return (
              <div
                key={product.product_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr 140px 120px 80px 80px 120px',
                  padding: '12px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                onClick={() => router.push(`/products/${product.product_id}${brandQuery}`)}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--ink-10)' }}>
                  {product.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-30)' }}>{product.product_name_clean[0]}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.product_name_clean}
                  </div>
                  {product.package_size_value && (
                    <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 1 }}>
                      {product.package_size_value} {product.package_size_uom}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-30)', fontFamily: 'var(--font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.primary_barcode ?? '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.l3_name ?? product.l2_name ?? '—'}
                </div>
                <div style={{ fontSize: 12, fontWeight: product.total_battles > 0 ? 500 : 400, color: product.total_battles > 0 ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                  {product.total_battles > 0 ? product.total_battles : '—'}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: product.elo_score ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                  {product.elo_score ? Math.round(Number(product.elo_score)) : '—'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: isClaimed ? 'var(--sage)' : 'var(--ink-30)',
                    background: isClaimed ? 'var(--sage-pale)' : 'var(--surface-1)',
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}>
                    {isClaimed ? 'Active' : 'Not claimed'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
