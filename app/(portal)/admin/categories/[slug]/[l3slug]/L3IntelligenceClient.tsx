'use client'

import { L3Breadcrumb } from './intel/L3Breadcrumb'
import { L3InsightCards } from './intel/L3InsightCards'
import { L3RankTable } from './intel/L3RankTable'
import { L3RankToolbar } from './intel/L3RankToolbar'
import { L3StatStrip } from './intel/L3StatStrip'
import { L3Title } from './intel/L3Title'
import type { Product } from './intel/l3Model'
import { useL3Intelligence } from './intel/useL3Intelligence'

interface Props {
  l2Name: string
  l3Name: string
  products: Product[]
}

export default function L3IntelligenceClient({ l2Name, l3Name, products }: Props) {
  const intel = useL3Intelligence(products)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>
      <L3Breadcrumb l2Name={l2Name} l3Name={l3Name} />
      <L3Title l2Name={l2Name} l3Name={l3Name} />
      <L3StatStrip
        productCount={products.length}
        totalBattles={intel.totalBattles}
        meaningfulCount={intel.meaningful.length}
        meaningfulPct={intel.meaningfulPct}
      />
      <L3InsightCards
        products={products}
        filter={intel.filter}
        setFilter={intel.setFilter}
        reachOut={intel.reachOut}
        overrated={intel.overrated}
        meaningful={intel.meaningful}
      />
      <div>
        <L3RankToolbar
          filteredLength={intel.filtered.length}
          filter={intel.filter}
          setFilter={intel.setFilter}
          sort={intel.sort}
          setSort={intel.setSort}
        />
        <L3RankTable filtered={intel.filtered} />
      </div>
    </div>
  )
}
