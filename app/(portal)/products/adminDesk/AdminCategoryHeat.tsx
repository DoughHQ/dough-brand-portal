import type { CategoryStat } from '@/lib/queries'
import type { useAdminProducts } from './useAdminProducts'

export function AdminCategoryHeat({
  categoryStats,
  router,
}: {
  categoryStats: CategoryStat[]
  router: ReturnType<typeof useAdminProducts>['router']
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
        Categories with battle data
      </div>
      <div style={{
        background: 'var(--paper)',
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
  )
}
