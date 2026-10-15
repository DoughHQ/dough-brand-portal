'use client'
import { CategoryIntelHeader } from './overview/CategoryIntelHeader'
import { CategoryL3Breakdown } from './overview/CategoryL3Breakdown'
import { CategoryLeaderboard } from './overview/CategoryLeaderboard'
import { CategoryStatStrip } from './overview/CategoryStatStrip'
import type { L3Row, Product } from './overview/categoryModel'
import { useCategoryIntelligence } from './overview/useCategoryIntelligence'

interface Props {
  l2Name: string
  products: Product[]
  l3Breakdown: L3Row[]
  scopeNote?: string | null
  loadError?: string | null
  emptyMessage?: string | null
}

export default function CategoryIntelligenceClient({
  l2Name,
  products,
  l3Breakdown,
  scopeNote,
  loadError,
  emptyMessage = 'No data for this category yet',
}: Props) {
  const intel = useCategoryIntelligence(products)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>
      <CategoryIntelHeader
        l2Name={l2Name}
        scopeNote={scopeNote}
        loadError={loadError}
        router={intel.router}
      />
      <CategoryStatStrip
        productCount={products.length}
        totalBattles={intel.totalBattles}
        totalBrands={intel.totalBrands}
        topElo={intel.topElo ?? 0}
        avgWinRate={intel.avgWinRate}
      />
      <CategoryL3Breakdown l2Name={l2Name} l3Breakdown={l3Breakdown} router={intel.router} />
      <CategoryLeaderboard
        filtered={intel.filtered}
        sort={intel.sort}
        setSort={intel.setSort}
        emptyMessage={emptyMessage}
        router={intel.router}
        enterAsBrand={intel.enterAsBrand}
        entering={intel.entering}
      />
    </div>
  )
}
