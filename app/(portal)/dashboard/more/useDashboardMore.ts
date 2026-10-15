'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { BrandSubscription } from '@/lib/queries'
import type { CategoryProduct, CategoryStat, Period } from './dashboardFormat'

export function useDashboardMore({
  brandId,
  subscription,
  claimedSkuCount,
  totalProductCount,
  allProductsLength,
}: {
  brandId: number
  subscription: BrandSubscription | null
  claimedSkuCount?: number
  totalProductCount?: number
  allProductsLength: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const [period, setPeriod] = useState<Period>('30d')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set())
  const [catProducts, setCatProducts] = useState<Record<number, CategoryProduct[]>>({})
  const [loadingCatProducts, setLoadingCatProducts] = useState<Set<number>>(new Set())

  async function ensureCategoryStats() {
    if (categoryStats.length > 0) return
    const { data } = await supabase.rpc('get_brand_category_stats', {
      p_brand_id: brandId,
    })
    setCategoryStats((data ?? []) as CategoryStat[])
  }

  function toggleCat(nodeId: number) {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  async function loadCategoryProducts(nodeId: number) {
    if (catProducts[nodeId] || loadingCatProducts.has(nodeId)) return
    setLoadingCatProducts(prev => new Set(prev).add(nodeId))
    const { data } = await supabase.rpc('get_brand_category_products', {
      p_brand_id: brandId,
      p_taxonomy_node_id: nodeId,
    })
    setCatProducts(prev => ({ ...prev, [nodeId]: (data ?? []) as CategoryProduct[] }))
    setLoadingCatProducts(prev => {
      const next = new Set(prev); next.delete(nodeId); return next
    })
  }

  const claimedCount = claimedSkuCount ?? 0
  const skuLimit = subscription?.total_sku_limit ?? Math.max(claimedCount, 1)
  const lockedCount = Math.max(0, (totalProductCount ?? allProductsLength) - claimedCount)

  return {
    period,
    setPeriod,
    expandedCard,
    setExpandedCard,
    categoryStats,
    expandedCats,
    catProducts,
    loadingCatProducts,
    ensureCategoryStats,
    toggleCat,
    loadCategoryProducts,
    claimedCount,
    skuLimit,
    lockedCount,
    openProduct: (productId: number) => router.push(`/products/${productId}`),
    findProduct: () => router.push('/products'),
  }
}
