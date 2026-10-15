import type { CategoryProduct } from './dashboardFormat'

export function DashboardCategoryProducts({
  products,
  isLoading,
  onOpenProduct,
}: {
  products: CategoryProduct[]
  isLoading: boolean
  onOpenProduct: (productId: number) => void
}) {
  return (
    <div style={{
      borderTop: '1px solid var(--ink-10)',
      background: 'var(--surface)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 90px 80px 80px 100px',
        padding: '6px 20px 6px 44px',
        borderBottom: '1px solid var(--ink-10)',
      }}>
        {['', 'Product', 'Battles', 'Win rate', 'ELO', 'Percentile'].map((h, idx) => (
          <div key={idx} style={{
            fontSize: 9,
            fontWeight: 500,
            color: 'var(--ink-30)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textAlign: idx <= 1 ? 'left' : 'right',
          }}>
            {h}
          </div>
        ))}
      </div>

      {isLoading && (
        <div style={{ padding: '16px 44px', fontSize: 12, color: 'var(--ink-30)' }}>
          Loading...
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div style={{ padding: '16px 44px', fontSize: 12, color: 'var(--ink-30)' }}>
          No products with battle data in this category yet.
        </div>
      )}

      {products.map((prod, pi) => (
        <div
          key={prod.product_id}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 90px 80px 80px 100px',
            padding: '10px 20px 10px 44px',
            borderBottom: pi < products.length - 1 ? '1px solid var(--ink-10)' : 'none',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={() => onOpenProduct(prod.product_id)}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {prod.image_url ? (
              // Remote catalog URLs bypass the server-side image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={prod.image_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)' }}>
                {prod.product_name_clean[0]}
              </span>
            )}
          </div>

          <div style={{
            fontSize: 13,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {prod.product_name_clean}
          </div>

          <div style={{
            fontSize: 12,
            color: prod.battles_total > 0 ? 'var(--ink)' : 'var(--ink-30)',
            fontWeight: prod.battles_total > 0 ? 500 : 400,
            textAlign: 'right',
          }}>
            {prod.battles_total > 0 ? prod.battles_total : '—'}
          </div>

          <div style={{
            fontSize: 12,
            color: prod.win_rate_pct != null ? 'var(--ink)' : 'var(--ink-30)',
            textAlign: 'right',
          }}>
            {prod.win_rate_pct != null ? `${Math.round(Number(prod.win_rate_pct))}%` : '—'}
          </div>

          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 14,
            fontWeight: 400,
            color: prod.elo_score ? 'var(--ink)' : 'var(--ink-30)',
            textAlign: 'right',
          }}>
            {prod.elo_score ? Math.round(Number(prod.elo_score)) : '—'}
          </div>

          <div style={{
            fontSize: 12,
            color: prod.user_percentile != null ? 'var(--ink-50)' : 'var(--ink-30)',
            textAlign: 'right',
          }}>
            {prod.user_percentile != null
              ? `${Math.round(Number(prod.user_percentile))}th`
              : '—'}
          </div>
        </div>
      ))}
    </div>
  )
}
