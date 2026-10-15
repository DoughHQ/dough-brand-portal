import type { L3Row } from './categoryModel'
import type { useCategoryIntelligence } from './useCategoryIntelligence'

export function CategoryL3Breakdown({
  l2Name,
  l3Breakdown,
  router,
}: {
  l2Name: string
  l3Breakdown: L3Row[]
  router: ReturnType<typeof useCategoryIntelligence>['router']
}) {
  return (
    <>
      {l3Breakdown.length > 1 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>
            Sub-categories
          </div>
          <div style={{
            background: 'var(--paper)',
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
    </>
  )
}
