import Link from 'next/link'
import ProductCategoryStandingCard from '@/components/brandHome/ProductCategoryStandingCard'
import type { Brand, BrandSnapshot, ProductIntelligence } from '@/lib/queries'
import { DashboardCategoryTable } from './DashboardCategoryTable'
import { DashboardInsights } from './DashboardInsights'
import { DashboardSkuTable } from './DashboardSkuTable'
import type { Period } from './dashboardFormat'
import type { useDashboardMore } from './useDashboardMore'

type More = ReturnType<typeof useDashboardMore>

export function DashboardMore({
  more,
  brand,
  snapshot,
  productIntelligence,
  allProducts,
  totalProductCount,
}: {
  more: More
  brand: Brand
  snapshot: BrandSnapshot | null
  productIntelligence: ProductIntelligence[]
  allProducts: { product_id: number; product_name_display: string; total_battles: number }[]
  totalProductCount?: number
}) {
  const {
    period,
    setPeriod,
    expandedCard,
    setExpandedCard,
    ensureCategoryStats,
    claimedCount,
    lockedCount,
    skuLimit,
    openProduct,
    findProduct,
  } = more

  return (
    <details
      className="bh-more"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) void ensureCategoryStats()
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-50)',
          padding: '12px 0',
          borderTop: '1px solid var(--mist)',
          listStyle: 'none',
        }}
      >
        More brand data
      </summary>

      <div style={{ height:52, borderBottom:'1px solid var(--ink-10)', display:'flex', alignItems:'center', padding:'0 0', gap:16, background:'transparent', marginBottom: 16 }}>
        <div style={{ display:'flex', alignItems:'center', background:'var(--surface-1)', borderRadius:'var(--r-sm)', padding:3, gap:1 }}>
          {(['7d','30d','90d','all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding:'4px 12px', borderRadius:4, fontSize:12, fontWeight:period===p?500:400, color:period===p?'var(--ink)':'var(--ink-50)', background:period===p?'var(--on-fill)':'transparent', boxShadow:period===p?'0 1px 3px rgba(0,0,0,0.08)':'none', cursor:'pointer', fontFamily:'var(--font-sans)', border:'none' }}>
              {p === 'all' ? 'All time' : p}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <Link href="/products" style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:500, color:'white', background:'var(--sage)', textDecoration:'none', fontFamily:'var(--font-sans)' }}>Add SKU</Link>
      </div>

      <div style={{ padding:'24px 0', display:'flex', flexDirection:'column', gap:20, flex:1 }}>
        <DashboardCategoryTable
          brand={brand}
          categoryStats={more.categoryStats}
          expandedCats={more.expandedCats}
          catProducts={more.catProducts}
          loadingCatProducts={more.loadingCatProducts}
          toggleCat={more.toggleCat}
          loadCategoryProducts={more.loadCategoryProducts}
          onOpenProduct={openProduct}
        />

        <div style={{ marginBottom: 20 }}>
          <ProductCategoryStandingCard
            catalogProductCount={totalProductCount ?? allProducts.length}
          />
        </div>

        <DashboardInsights
          brand={brand}
          snapshot={snapshot}
          expandedCard={expandedCard}
          setExpandedCard={setExpandedCard}
        />
        <DashboardSkuTable
          productIntelligence={productIntelligence}
          allProducts={allProducts}
          claimedCount={claimedCount}
          lockedCount={lockedCount}
          skuLimit={skuLimit}
          totalProductCount={totalProductCount}
          onFindProduct={findProduct}
        />
      </div>
    </details>
  )
}
