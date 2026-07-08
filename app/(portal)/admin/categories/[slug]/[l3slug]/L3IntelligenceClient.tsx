'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'

type Product = {
  product_id: number
  product_name_clean: string
  brand_id: number
  brand_name: string
  has_portal_access: boolean
  battles_total: number
  battles_won: number
  win_rate_pct: number | null
  elo_score: number | null
  price_tier_label: string | null
  image_url: string | null
  last_battle_at: string | null
  is_statistically_meaningful: boolean
  insight_tag: string | null
}

const INSIGHT_CONFIG: Record<string, { label: string; color: string; bg: string; description: string }> = {
  reach_out: {
    label: 'Reach out',
    color: 'var(--sage)',
    bg: 'var(--sage-pale)',
    description: '10+ battles · strong win rate · no portal access',
  },
  trending: {
    label: 'Trending',
    color: '#185FA5',
    bg: '#E6F1FB',
    description: 'Most battles in this category',
  },
  overrated: {
    label: 'Overrated',
    color: '#BA7517',
    bg: '#FAEEDA',
    description: 'High ELO but fewer than 5 battles — sample too small',
  },
  underrated: {
    label: 'Underrated',
    color: '#533AB7',
    bg: '#EEEDFE',
    description: 'Win rate suggests ELO should be higher',
  },
  early_data: {
    label: 'Early data',
    color: 'var(--ink-30)',
    bg: 'var(--surface-1)',
    description: 'Fewer than 5 battles — inconclusive',
  },
}

type SortKey = 'elo' | 'win_rate' | 'battles'
type FilterKey = 'all' | 'reach_out' | 'trending' | 'overrated' | 'underrated' | 'meaningful'

interface Props {
  l2Name: string
  l3Name: string
  products: Product[]
}

export default function L3IntelligenceClient({ l2Name, l3Name, products }: Props) {
  const router = useRouter()
  const { enterAsBrand, loading: entering } = useEnterImpersonation()
  const [sort, setSort] = useState<SortKey>('elo')
  const [filter, setFilter] = useState<FilterKey>('all')

  const reachOut = products.filter(p => p.insight_tag === 'reach_out')
  const overrated = products.filter(p => p.insight_tag === 'overrated')
  const meaningful = products.filter(p => p.is_statistically_meaningful)

  const totalBattles = products.reduce((s, p) => s + p.battles_total, 0)
  const meaningfulPct = Math.round((meaningful.length / products.length) * 100)

  const filtered = products
    .filter(p => {
      if (filter === 'all') return true
      if (filter === 'meaningful') return p.is_statistically_meaningful
      return p.insight_tag === filter
    })
    .sort((a, b) => {
      if (sort === 'elo') return Number(b.elo_score ?? 0) - Number(a.elo_score ?? 0)
      if (sort === 'win_rate') return Number(b.win_rate_pct ?? 0) - Number(a.win_rate_pct ?? 0)
      return b.battles_total - a.battles_total
    })

  function relativeTime(dateStr: string | null): string {
    if (!dateStr) return 'No recent activity'
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 28, fontSize: 12, color: 'var(--ink-50)' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => router.push('/products')}>Products</span>
        <span style={{ color: 'var(--ink-30)' }}>→</span>
        <span
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(`/admin/categories/${encodeURIComponent(l2Name)}`)}
        >
          {l2Name}
        </span>
        <span style={{ color: 'var(--ink-30)' }}>→</span>
        <span style={{ color: 'var(--ink)' }}>{l3Name}</span>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          L3 Category intelligence
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
          {l3Name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>
          {l2Name} · Ranked by declared consumer preference
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Products battled', value: products.length },
          { label: 'Total battles', value: totalBattles },
          { label: 'Statistically meaningful', value: `${meaningful.length} of ${products.length}` },
          { label: 'Data coverage', value: `${meaningfulPct}%` },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: 'var(--ink)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-lg)',
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 16 }}>
          Insights
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>

          {reachOut.length > 0 && (
            <div
              onClick={() => setFilter(filter === 'reach_out' ? 'all' : 'reach_out')}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                background: filter === 'reach_out' ? 'var(--sage-pale)' : 'var(--surface-1)',
                border: `1px solid ${filter === 'reach_out' ? 'rgba(74,124,89,0.3)' : 'var(--ink-10)'}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Reach out now · {reachOut.length}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                {reachOut.map(p => p.brand_name).join(', ')} {reachOut.length === 1 ? 'has' : 'have'} meaningful battle data
                but no portal access.
              </div>
            </div>
          )}

          {overrated.length > 0 && (
            <div
              onClick={() => setFilter(filter === 'overrated' ? 'all' : 'overrated')}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                background: filter === 'overrated' ? '#FAEEDA' : 'var(--surface-1)',
                border: `1px solid ${filter === 'overrated' ? 'rgba(186,117,23,0.3)' : 'var(--ink-10)'}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Overrated · {overrated.length}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                {overrated.length} product{overrated.length !== 1 ? 's' : ''} with high ELO but fewer
                than 5 battles. Sample too small to trust.
              </div>
            </div>
          )}

          <div
            onClick={() => setFilter(filter === 'meaningful' ? 'all' : 'meaningful')}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--r-md)',
              background: filter === 'meaningful' ? '#EEEDFE' : 'var(--surface-1)',
              border: `1px solid ${filter === 'meaningful' ? 'rgba(83,58,183,0.3)' : 'var(--ink-10)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: '#533AB7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Statistically meaningful · {meaningful.length}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
              {meaningful.length} product{meaningful.length !== 1 ? 's' : ''} with 10+ battles.
              ELO rankings are reliable for these.
            </div>
          </div>

          {products.length > meaningful.length && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-1)',
              border: '1px solid var(--ink-10)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Need more data · {products.length - meaningful.length}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
                {products.length - meaningful.length} product{products.length - meaningful.length !== 1 ? 's' : ''} with
                fewer than 10 battles. Rankings will shift as data builds.
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
            Rankings
            <span style={{ fontSize: 11, color: 'var(--ink-30)', fontWeight: 400, marginLeft: 8 }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {filter !== 'all' ? ` · ${filter === 'meaningful' ? 'statistically meaningful' : filter.replace('_', ' ')} filter` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                style={{ fontSize: 11, color: 'var(--ink-50)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              >
                Clear filter ×
              </button>
            )}
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
        </div>

        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          minHeight: 400,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 44px 1fr 160px 80px 80px 80px 110px 50px',
            padding: '8px 20px',
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--ink-10)',
          }}>
            {['', '#', 'Product', 'Brand', 'Battles', 'Win rate', 'ELO', 'Signal', 'Tier'].map((h, i) => (
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

          {filtered.map((product, i) => {
            const insight = product.insight_tag ? INSIGHT_CONFIG[product.insight_tag] : null
            return (
              <div
                key={product.product_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 44px 1fr 160px 80px 80px 80px 110px 50px',
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
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--surface-1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: '1px solid var(--ink-10)', flexShrink: 0,
                }}>
                  {product.image_url
                    ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)' }}>{product.product_name_clean[0]}</span>
                  }
                </div>

                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 400, color: i < 3 ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right', paddingRight: 8 }}>
                  {i + 1}
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.product_name_clean}
                  </div>
                  {product.last_battle_at && (
                    <div style={{ fontSize: 10, color: 'var(--ink-30)', marginTop: 1 }}>
                      {relativeTime(product.last_battle_at)}
                    </div>
                  )}
                </div>

                <div
                  onClick={e => {
                    e.stopPropagation()
                    if (!entering) void enterAsBrand(product.brand_id, '/dashboard')
                  }}
                  style={{
                    fontSize: 12, color: 'var(--ink-50)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textAlign: 'right', cursor: 'pointer',
                    textDecoration: product.has_portal_access ? 'none' : 'underline',
                    textDecorationColor: 'var(--ink-10)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--sage)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-50)')}
                >
                  {product.brand_name}
                  {product.has_portal_access && (
                    <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--sage)' }}>●</span>
                  )}
                </div>

                <div style={{
                  fontSize: 13,
                  fontWeight: product.is_statistically_meaningful ? 500 : 400,
                  color: product.is_statistically_meaningful ? 'var(--ink)' : 'var(--ink-50)',
                  textAlign: 'right',
                }}>
                  {product.battles_total}
                </div>

                <div style={{ fontSize: 13, color: 'var(--ink)', textAlign: 'right' }}>
                  {product.win_rate_pct != null ? `${product.win_rate_pct}%` : '—'}
                </div>

                <div style={{
                  fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400,
                  color: i === 0 ? 'var(--sage)' : 'var(--ink)',
                  textAlign: 'right',
                }}>
                  {product.elo_score ? Math.round(Number(product.elo_score)) : '—'}
                </div>

                <div style={{ textAlign: 'right' }}>
                  {insight && (
                    <div style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 500,
                      color: insight.color,
                      background: insight.bg,
                      padding: '2px 8px',
                      borderRadius: 20,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}>
                      {insight.label}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--ink-30)', textAlign: 'right' }}>
                  {product.price_tier_label ?? '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
