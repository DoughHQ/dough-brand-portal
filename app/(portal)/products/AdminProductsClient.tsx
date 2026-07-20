'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'
import type { PortalUser, CategoryStat, MilestoneAlert } from '@/lib/queries'

type ProductResult = {
  product_id: number
  product_name_clean: string
  brand_name: string
  brand_id: number
  l2_name: string | null
  l3_name: string | null
  battles_total: number
  win_rate_pct: number | null
  elo_score: number | null
  milestone: string
}

interface Props {
  portalUser: PortalUser
  categoryStats: CategoryStat[]
  milestoneAlerts: MilestoneAlert[]
}

export default function AdminProductsClient({ portalUser, categoryStats, milestoneAlerts }: Props) {
  const router = useRouter()
  const { enterAsBrand, loading: entering } = useEnterImpersonation()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductResult[]>([])
  const [searching, setSearching] = useState(false)
  const [productIdJump, setProductIdJump] = useState('')

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await createClient().rpc('search_products_admin', { p_query: q.trim() })
    setSearching(false)
    setSearchResults((data ?? []) as ProductResult[])
  }

  function openById() {
    const id = parseInt(productIdJump.trim(), 10)
    if (!Number.isNaN(id) && id > 0) {
      router.push(`/products/${id}`)
    }
  }

  const milestoneLabel: Record<string, string> = {
    '10_battles': '10 battles',
    '25_battles': '25 battles',
    '50_battles': '50 battles',
    '100_battles': '100 battles',
    'first_battle': 'First battle',
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Admin
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)' }}>
          Products
        </div>
      </div>

      {/* Product search */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 12, lineHeight: 1.45 }}>
          Search a product name or brand, open a milestone below, or jump by product ID.
          Row click opens the master product page.
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search products or brands..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--ink-10)',
              background: 'var(--white)',
              fontSize: 14,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--ink-30)'}
            onBlur={e => e.target.style.borderColor = 'var(--ink-10)'}
          />
          <form
            onSubmit={e => {
              e.preventDefault()
              openById()
            }}
            style={{ display: 'flex', gap: 6, flexShrink: 0 }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={productIdJump}
              onChange={e => setProductIdJump(e.target.value)}
              placeholder="Product ID"
              style={{
                width: 120,
                padding: '12px 12px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--ink-10)',
                background: 'var(--white)',
                fontSize: 14,
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 14px',
                borderRadius: 'var(--r-sm)',
                border: 'none',
                background: 'var(--sage)',
                color: 'white',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Open
            </button>
          </form>
        </div>

        {/* Search results */}
        {(searchResults.length > 0 || searching) && (
          <div style={{
            marginTop: 8,
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
          }}>
            {searching && (
              <div style={{ padding: '14px 20px', fontSize: 12, color: 'var(--ink-30)' }}>Searching...</div>
            )}
            {searchResults.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 100px 80px 90px 90px 72px',
                padding: '8px 20px',
                background: 'var(--surface-1)',
                borderBottom: '1px solid var(--ink-10)',
              }}>
                {['Product', 'Brand', 'Category', 'Battles', 'Win rate', 'ELO', ''].map(h => (
                  <div key={h || 'open'} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Product' || h === 'Brand' || h === '' ? 'left' : 'right' }}>
                    {h}
                  </div>
                ))}
              </div>
            )}
            {searchResults.map((product, i) => (
              <div
                key={product.product_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px 100px 80px 90px 90px 72px',
                  padding: '12px 20px',
                  borderBottom: i < searchResults.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => router.push(`/products/${product.product_id}`)}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.product_name_clean}
                  </div>
                  {product.milestone !== 'no battles' && (
                    <div style={{ fontSize: 10, color: 'var(--sage)', marginTop: 2, fontWeight: 500 }}>
                      {product.milestone}
                    </div>
                  )}
                </div>
                <div
                  style={{ fontSize: 12, color: 'var(--ink-50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: entering ? 'default' : 'pointer' }}
                  onClick={e => {
                    e.stopPropagation()
                    if (!entering) void enterAsBrand(product.brand_id, '/dashboard')
                  }}
                >
                  {product.brand_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-30)', textAlign: 'right' }}>
                  {product.l3_name ?? product.l2_name ?? '—'}
                </div>
                <div style={{ fontSize: 13, fontWeight: product.battles_total > 0 ? 500 : 400, color: product.battles_total > 0 ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                  {product.battles_total > 0 ? product.battles_total : '—'}
                </div>
                <div style={{ fontSize: 13, color: product.win_rate_pct != null ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                  {product.win_rate_pct != null ? `${product.win_rate_pct}%` : '—'}
                </div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-serif)', color: product.elo_score ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                  {product.elo_score ? Math.round(Number(product.elo_score)) : '—'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      router.push(`/products/${product.product_id}`)
                    }}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--sage)',
                      background: 'var(--sage-pale)',
                      border: '1px solid rgba(62,107,74,0.2)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-30)' }}>
            No products matched “{searchQuery}”. Try a product ID on the right.
          </div>
        )}
      </div>

      {/* Two column layout: categories + milestone alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* Category heat map */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
            Categories with battle data
          </div>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px 80px 24px',
              padding: '8px 20px',
              background: 'var(--surface-1)',
              borderBottom: '1px solid var(--ink-10)',
            }}>
              {['Category', 'Battles', 'Products', 'Brands', 'Density', ''].map(h => (
                <div key={h || 'arrow'} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Category' ? 'left' : 'right' }}>
                  {h}
                </div>
              ))}
            </div>
            {categoryStats.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: 12, color: 'var(--ink-30)' }}>
                No battle data yet.
              </div>
            ) : categoryStats.map((cat, i) => {
              const maxBattles = categoryStats[0]?.total_battles ?? 1
              const barWidth = Math.round((cat.total_battles / maxBattles) * 100)
              return (
                <div
                  key={cat.l2_name}
                  style={{
                    borderBottom: i < categoryStats.length - 1 ? '1px solid var(--ink-10)' : 'none',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(`/admin/categories/${encodeURIComponent(cat.l2_name)}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: `${barWidth}%`,
                    background: 'var(--sage-pale)',
                    opacity: 0.6,
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 80px 80px 24px',
                    padding: '12px 20px',
                    alignItems: 'center',
                    position: 'relative',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{cat.l2_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 1 }}>{cat.l1_name}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', textAlign: 'right' }}>
                      {cat.total_battles.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'right' }}>
                      {cat.products_with_battles.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'right' }}>
                      {cat.brands_represented.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'right' }}>
                      {cat.battle_density_pct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-30)', textAlign: 'right' }}>→</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Milestone alerts */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
            Milestone alerts
          </div>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
          }}>
            {milestoneAlerts.length === 0 && (
              <div style={{ padding: 20, fontSize: 12, color: 'var(--ink-30)' }}>No new milestones.</div>
            )}
            {milestoneAlerts.map((alert, i) => (
              <div
                key={alert.alert_id}
                style={{
                  padding: '14px 18px',
                  borderBottom: i < milestoneAlerts.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => router.push(`/products/${alert.product_id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alert.products?.product_name_clean ?? `Product ${alert.product_id}`}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'var(--sage)',
                    background: 'var(--sage-pale)',
                    padding: '2px 8px',
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {milestoneLabel[alert.milestone_type] ?? alert.milestone_type}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                  {alert.brands?.brand_name ?? ''}
                  {alert.win_rate_at_trigger != null && ` · ${alert.win_rate_at_trigger}% win rate`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
