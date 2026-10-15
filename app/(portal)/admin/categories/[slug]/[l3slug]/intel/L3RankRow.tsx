import type { useRouter } from 'next/navigation'
import type { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'
import { INSIGHT_CONFIG, relativeTime, type Product } from './l3Model'

export function L3RankRow({
  product,
  index,
  rowCount,
  router,
  enterAsBrand,
  entering,
}: {
  product: Product
  index: number
  rowCount: number
  router: ReturnType<typeof useRouter>
  enterAsBrand: ReturnType<typeof useEnterImpersonation>['enterAsBrand']
  entering: boolean
}) {
  const i = index
  const filtered = { length: rowCount }
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
          ? <>
              {/* Remote catalog URLs bypass the server-side image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </>
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
}
