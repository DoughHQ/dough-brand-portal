'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'
import { rankCategoryProducts, type Product, type SortKey } from './categoryModel'

export function useCategoryIntelligence(products: Product[]) {
  const router = useRouter()
  const { enterAsBrand, loading: entering } = useEnterImpersonation()
  const [sort, setSort] = useState<SortKey>('elo')

  const totalBattles = products.reduce((s, p) => s + p.battles_total, 0)
  const totalBrands = new Set(products.map(p => p.brand_id)).size
  const topElo = products[0]?.elo_score ?? 0
  const avgWinRate = products.length > 0
    ? Math.round(products.reduce((s, p) => s + Number(p.win_rate_pct ?? 0), 0) / products.length)
    : 0

  const filtered = rankCategoryProducts(products, sort)

  return {
    router,
    enterAsBrand,
    entering,
    sort,
    setSort,
    totalBattles,
    totalBrands,
    topElo,
    avgWinRate,
    filtered,
  }
}
