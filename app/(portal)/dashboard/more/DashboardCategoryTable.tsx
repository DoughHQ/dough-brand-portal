import { PRODUCT_NAME } from '@/lib/brand'
import type { Brand } from '@/lib/queries'
import { DashboardCategoryProducts } from './DashboardCategoryProducts'
import type { CategoryProduct, CategoryStat } from './dashboardFormat'

export function DashboardCategoryTable({
  brand,
  categoryStats,
  expandedCats,
  catProducts,
  loadingCatProducts,
  toggleCat,
  loadCategoryProducts,
  onOpenProduct,
}: {
  brand: Brand
  categoryStats: CategoryStat[]
  expandedCats: Set<number>
  catProducts: Record<number, CategoryProduct[]>
  loadingCatProducts: Set<number>
  toggleCat: (nodeId: number) => void
  loadCategoryProducts: (nodeId: number) => void
  onOpenProduct: (productId: number) => void
}) {
  return (
    <>
    {categoryStats.length > 0 && (
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          fontWeight: 400,
          color: 'var(--ink)',
          marginBottom: 12,
        }}>
          Your categories on {PRODUCT_NAME}
        </div>
        <div style={{
          background: 'var(--paper)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr 90px 80px 80px 100px',
            padding: '8px 20px',
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--ink-10)',
          }}>
            <div />
            {['Category', 'Products', 'Battles', 'Win rate', 'Top ELO'].map(h => (
              <div key={h} style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--ink-30)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textAlign: h === 'Category' ? 'left' : 'right',
              }}>
                {h}
              </div>
            ))}
          </div>

          {categoryStats.map((cat, i) => {
            const nodeId = Number(cat.taxonomy_node_id)
            const isExpanded = expandedCats.has(nodeId)
            const hasBattles = Number(cat.total_battles) > 0
            const products = catProducts[nodeId] ?? []
            const isLoading = loadingCatProducts.has(nodeId)

            return (
              <div key={nodeId} style={{
                borderBottom: i < categoryStats.length - 1 ? '1px solid var(--ink-10)' : 'none',
              }}>
                <div
                  onClick={() => {
                    toggleCat(nodeId)
                    if (!isExpanded) loadCategoryProducts(nodeId)
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 90px 80px 80px 100px',
                    padding: '13px 20px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--surface-1)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-1)' }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    fontSize: 10,
                    color: 'var(--ink-30)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                    userSelect: 'none',
                  }}>
                    ▶
                  </div>

                  <div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--ink)',
                    }}>
                      {cat.l3_name ?? cat.l2_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 1 }}>
                      {cat.l2_name}
                      {cat.top_product_name ? ` · ${cat.top_product_name}` : ''}
                    </div>
                  </div>

                  <div style={{
                    fontSize: 12,
                    color: 'var(--ink-50)',
                    textAlign: 'right',
                  }}>
                    {Number(cat.total_products).toLocaleString()}
                  </div>

                  <div style={{
                    fontSize: 13,
                    fontWeight: hasBattles ? 500 : 400,
                    color: hasBattles ? 'var(--ink)' : 'var(--ink-30)',
                    textAlign: 'right',
                  }}>
                    {hasBattles ? Number(cat.total_battles).toLocaleString() : '—'}
                  </div>

                  <div style={{
                    fontSize: 13,
                    color: cat.win_rate_pct != null ? 'var(--ink)' : 'var(--ink-30)',
                    textAlign: 'right',
                  }}>
                    {cat.win_rate_pct != null ? `${cat.win_rate_pct}%` : '—'}
                  </div>

                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 16,
                    fontWeight: 400,
                    color: cat.top_elo ? 'var(--ink)' : 'var(--ink-30)',
                    textAlign: 'right',
                  }}>
                    {cat.top_elo ? Math.round(Number(cat.top_elo)) : '—'}
                  </div>
                </div>

                {isExpanded && (
    <DashboardCategoryProducts
                  products={products}
                  isLoading={isLoading}
                  onOpenProduct={onOpenProduct}
                />
                )}
              </div>
            )
          })}

          {categoryStats.length > 0 && (
            <div style={{
              padding: '12px 20px',
              fontSize: 11,
              color: 'var(--ink-30)',
              borderTop: '1px solid var(--ink-10)',
              background: 'var(--surface-1)',
            }}>
              {brand.brand_name} has products in {categoryStats.length} categories.
              {' '}{categoryStats.filter(c => Number(c.total_battles) > 0).length} have battle data so far.
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}
