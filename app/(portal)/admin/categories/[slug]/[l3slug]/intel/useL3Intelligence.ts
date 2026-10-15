'use client'

import { useState } from 'react'
import type { FilterKey, Product, SortKey } from './l3Model'
import { rankProducts } from './l3Model'

export function useL3Intelligence(products: Product[]) {
  const [sort, setSort] = useState<SortKey>('elo')
  const [filter, setFilter] = useState<FilterKey>('all')

  const reachOut = products.filter(p => p.insight_tag === 'reach_out')
  const overrated = products.filter(p => p.insight_tag === 'overrated')
  const meaningful = products.filter(p => p.is_statistically_meaningful)

  const totalBattles = products.reduce((s, p) => s + p.battles_total, 0)
  const meaningfulPct = Math.round((meaningful.length / products.length) * 100)
  const filtered = rankProducts(products, filter, sort)

  return {
    sort,
    setSort,
    filter,
    setFilter,
    reachOut,
    overrated,
    meaningful,
    totalBattles,
    meaningfulPct,
    filtered,
  }
}
