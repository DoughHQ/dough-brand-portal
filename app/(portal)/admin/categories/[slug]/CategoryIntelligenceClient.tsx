'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'

type Product = {
  product_id: number
  product_name_clean: string
  brand_id: number
  brand_name: string
  l3_name: string | null
  battles_total: number
  battles_won: number
  win_rate_pct: number | null
  elo_score: number | null
  price_tier_label: string | null
  image_url: string | null
  rank: number
}

type L3Row = {
  l3_name: string
  taxonomy_node_id: number
  total_products: number
  products_battled: number
  total_battles: number
  top_elo: number | null
  avg_win_rate: number | null
}

type SortKey = 'elo' | 'win_rate' | 'battles'

interface Props {
  l2Name: string
  products: Product[]
  l3Breakdown: L3Row[]
  scopeNote?: string | null
  loadError?: string | null
}

export default function CategoryIntelligenceClient({
  l2Name,
  products,
  l3Breakdown,
  scopeNote,
  loadError,
}: Props) {
  const router = useRouter()
  const { enterAsBrand, loading: entering } = useEnterImpersonation()
  const [sort, setSort] = useState<SortKey>('elo')

  const totalBattles = products.reduce((s, p) => s + p.battles_total, 0)
  const totalBrands = new Set(products.map(p => p.brand_id)).size
  const topElo = products[0]?.elo_score ?? 0
  const avgWinRate = products.length > 0
    ? Math.round(products.reduce((s, p) => s + Number(p.win_rate_pct ?? 0), 0) / products.length)
    : 0

  const filtered = [...products]
    .sort((a, b) => {
      if (sort === 'elo') return Number(b.elo_score ?? 0) - Number(a.elo_score ?? 0)
      if (sort === 'win_rate') return Number(b.win_rate_pct ?? 0) - Number(a.win_rate_pct ?? 0)
      return b.battles_total - a.battles_total
    })
    .map((p, i) => ({ ...p, displayRank: i + 1 }))

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      <div
        onClick={() => router.push('/products')}
        style={{ fontSize: 12, color: 'var(--ink-50)', marginBottom: 28, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        ← Products
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Category intelligence
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
          {l2Name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>
          Ranked by declared consumer preference · Click a product for the master page
        </div>
        {scopeNote && (
          <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>{scopeNote}</div>
        )}
        {loadError && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--clay, #a6543c)',
              marginTop: 8,
              padding: '10px 12px',
              background: 'var(--cream, #faf8f3)',
              borderRadius: 8,
              border: '1px solid var(--ink-10)',
            }}
          >
            Couldn’t load rankings: {loadError}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Products battled', value: products.length.toLocaleString() },
          { label: 'Total battles', value: totalBattles.toLocaleString() },
          { label: 'Brands represented', value: totalBrands.toLocaleString() },
          { label: 'Top ELO', value: topElo ? Math.round(Number(topElo)).toLocaleString() : '—' },
          { label: 'Avg win rate', value: `${avgWinRate}%` },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: 'var(--ink)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {l3Breakdown.length > 1 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>
            Sub-categories
          </div>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 90px 80px 80px 80px 24px',
              padding: '8px 20px',
              background: 'var(--surface-1)',
              borderBottom: '1px solid var(--ink-10)',
            }}>
              {['Sub-category', 'Products', 'Battled', 'Battles', 'Top ELO', 'Avg win', ''].map(h => (
                <div key={h || 'arrow'} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Sub-category' ? 'left' : 'right' }}>
                  {h}
                </div>
              ))}
            </div>
            {l3Breakdown.map((row, i) => {
              const maxBattles = l3Breakdown[0]?.total_battles ?? 1
              const barPct = Math.round((Number(row.total_battles) / Number(maxBattles)) * 100)
              return (
                <div
                  key={row.l3_name}
                  style={{
                    position: 'relative',
                    borderBottom: i < l3Breakdown.length - 1 ? '1px solid var(--ink-10)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(
                    `/admin/categories/${encodeURIComponent(l2Name)}/${encodeURIComponent(row.l3_name)}`
                  )}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${barPct}%`,
                    background: 'var(--sage-pale)',
                    opacity: Number(row.total_battles) > 0 ? 0.6 : 0,
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 90px 80px 80px 80px 24px',
                    padding: '11px 20px',
                    alignItems: 'center',
                    position: 'relative',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink)' }}>
                      {row.l3_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'right' }}>
                      {Number(row.total_products).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: Number(row.products_battled) > 0 ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right', fontWeight: Number(row.products_battled) > 0 ? 500 : 400 }}>
                      {Number(row.products_battled) > 0 ? Number(row.products_battled) : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: Number(row.total_battles) > 0 ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right', fontWeight: Number(row.total_battles) > 0 ? 500 : 400 }}>
                      {Number(row.total_battles) > 0 ? Number(row.total_battles).toLocaleString() : '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: row.top_elo ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                      {row.top_elo ? Math.round(Number(row.top_elo)) : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: row.avg_win_rate != null ? 'var(--ink-50)' : 'var(--ink-30)', textAlign: 'right' }}>
                      {row.avg_win_rate != null ? `${row.avg_win_rate}%` : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-30)', textAlign: 'right' }}>→</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div id="leaderboard" style={{ minHeight: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
            Leaderboard
            <span style={{ fontSize: 11, color: 'var(--ink-30)', fontWeight: 400, marginLeft: 8 }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 'var(--r-sm)', padding: 3 }}>
            {([['elo', 'ELO'], ['win_rate', 'Win rate'], ['battles', 'Battles']] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: sort === key ? 500 : 400,
                  color: sort === key ? 'var(--ink)' : 'var(--ink-50)',
                  background: sort === key ? 'var(--white)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: sort === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 44px 1fr 160px 120px 70px 80px 80px 50px',
            padding: '8px 20px',
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--ink-10)',
          }}>
            {['', '#', 'Product', 'Brand', 'Sub-category', 'Battles', 'Win rate', 'ELO', 'Tier'].map((h, i) => (
              <div key={i} style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--ink-30)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textAlign: i <= 2 ? 'left' : 'right',
              }}>
                {h}
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
              No battled products in this category yet.
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-30)' }}>
                When shoppers battle here, the Elo leaderboard will show up — and each row opens the product master page.
              </div>
            </div>
          ) : (
            filtered.map((product, i) => (
            <div
              key={product.product_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 44px 1fr 160px 120px 70px 80px 80px 50px',
                padding: '12px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--ink-10)' : 'none',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => router.push(`/products/${product.product_id}`)}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--surface-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid var(--ink-10)',
                flexShrink: 0,
              }}>
                {product.image_url ? (
                  <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)' }}>
                    {product.product_name_clean[0]}
                  </span>
                )}
              </div>

              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 400, color: i < 3 ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right', paddingRight: 8 }}>
                {product.displayRank}
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.product_name_clean}
              </div>

              <div
                onClick={e => {
                  e.stopPropagation()
                  if (!entering) void enterAsBrand(product.brand_id, '/dashboard')
                }}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-50)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                  textDecoration: 'underline',
                  textDecorationColor: 'var(--ink-10)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--sage)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-50)')}
              >
                {product.brand_name}
              </div>

              <div style={{ fontSize: 11, color: 'var(--ink-30)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.l3_name}
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', textAlign: 'right' }}>
                {product.battles_total}
              </div>

              <div style={{ fontSize: 13, color: 'var(--ink)', textAlign: 'right' }}>
                {product.win_rate_pct != null ? `${product.win_rate_pct}%` : '—'}
              </div>

              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, color: i === 0 ? 'var(--sage)' : 'var(--ink)', textAlign: 'right' }}>
                {product.elo_score ? Math.round(Number(product.elo_score)) : '—'}
              </div>

              <div style={{ fontSize: 12, color: 'var(--ink-30)', textAlign: 'right' }}>
                {product.price_tier_label ?? '—'}
              </div>
            </div>
          ))
          )}
        </div>
      </div>

    </div>
  )
}
