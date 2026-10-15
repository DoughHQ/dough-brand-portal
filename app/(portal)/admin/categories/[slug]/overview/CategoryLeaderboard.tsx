import type { SortKey } from './categoryModel'
import type { rankCategoryProducts } from './categoryModel'
import type { useCategoryIntelligence } from './useCategoryIntelligence'

type Ranked = ReturnType<typeof rankCategoryProducts>[number]
type Intel = ReturnType<typeof useCategoryIntelligence>

export function CategoryLeaderboard({
  filtered,
  sort,
  setSort,
  emptyMessage,
  router,
  enterAsBrand,
  entering,
}: {
  filtered: Ranked[]
  sort: SortKey
  setSort: Intel['setSort']
  emptyMessage: string | null
  router: Intel['router']
  enterAsBrand: Intel['enterAsBrand']
  entering: boolean
}) {
  return (
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
                background: sort === key ? 'var(--paper)' : 'transparent',
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
        background: 'var(--paper)',
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
            {emptyMessage}
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
                // Remote catalog URLs are not safe inputs to the server-side image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
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
  )
}
