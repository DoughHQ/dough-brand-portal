'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchProductFacetSummaries } from '@/lib/facets/api'
import type { FacetSummaryRow } from '@/lib/facets/productFacets'
import type {
  BrandCatalogSummary,
  BrandProductPageCursor,
  BrandProductPageItem,
} from '@/lib/brandHome/parseBrandProductPage'
import { parseBrandProductPage } from '@/lib/brandHome/parseBrandProductPage'

async function fetchPage(opts: {
  cursor: BrandProductPageCursor | null
  battledOnly: boolean
  search: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('list_brand_products_page' as never, {
    p_limit: 50,
    p_cursor_battles: opts.cursor?.totalBattles ?? null,
    p_cursor_product_id: opts.cursor?.productId ?? null,
    p_battled_only: opts.battledOnly,
    p_search: opts.search.trim() || null,
  } as never)
  if (error) throw new Error(error.message)
  const page = parseBrandProductPage(data)
  if (!page) throw new Error('Could not parse products page')
  return page
}

export function useProductsCatalog({
  summary,
  initialItems,
  initialHasMore,
  initialCursor,
}: {
  summary: BrandCatalogSummary | null
  initialItems: BrandProductPageItem[]
  initialHasMore: boolean
  initialCursor: BrandProductPageCursor | null
}) {
  const [items, setItems] = useState<BrandProductPageItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<BrandProductPageCursor | null>(initialCursor)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showBattledOnly, setShowBattledOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [facetById, setFacetById] = useState<Record<number, FacetSummaryRow>>({})
  const [facetError, setFacetError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isPending, startTransition] = useTransition()
  const skipInitialFilterFetch = useRef(true)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(t)
  }, [search])

  const loadFacetSummaries = useCallback(async (products: BrandProductPageItem[]) => {
    const ids = products.map((p) => p.productId)
    if (ids.length === 0) {
      setFacetById({})
      return
    }
    const supabase = createClient()
    const { rows, error } = await fetchProductFacetSummaries(supabase, ids)
    if (error) setFacetError(error)
    else setFacetError(null)
    setFacetById((prev) => {
      const next = { ...prev }
      for (const row of rows) next[row.product_id] = row
      return next
    })
  }, [])

  useEffect(() => {
    void loadFacetSummaries(initialItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false
      if (!debouncedSearch && !showBattledOnly) return
    }
    let cancelled = false
    startTransition(() => {
      void (async () => {
        try {
          const page = await fetchPage({
            cursor: null,
            battledOnly: showBattledOnly,
            search: debouncedSearch,
          })
          if (cancelled) return
          setItems(page.items)
          setHasMore(page.hasMore)
          setCursor(page.nextCursor)
          setListError(null)
          setFacetById({})
          void loadFacetSummaries(page.items)
        } catch (err) {
          if (cancelled) return
          setListError(err instanceof Error ? err.message : String(err))
        }
      })()
    })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, showBattledOnly, loadFacetSummaries])

  async function loadMore() {
    if (!hasMore || !cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await fetchPage({
        cursor,
        battledOnly: showBattledOnly,
        search: debouncedSearch,
      })
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.productId))
        const merged = [...prev]
        for (const item of page.items) {
          if (!seen.has(item.productId)) merged.push(item)
        }
        return merged
      })
      setHasMore(page.hasMore)
      setCursor(page.nextCursor)
      void loadFacetSummaries(page.items)
      setListError(null)
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingMore(false)
    }
  }

  const productCount = summary?.productCount ?? items.length
  const battledCount = summary?.battledCount ?? items.filter((p) => p.hasBattleData).length
  const categoryCount = summary?.categoryCount ?? 0
  const claimedCount = summary?.claimedSkuCount ?? 0
  const unclaimedCount = Math.max(0, productCount - claimedCount)

  return {
    items,
    hasMore,
    search,
    setSearch,
    showBattledOnly,
    setShowBattledOnly,
    viewMode,
    setViewMode,
    facetById,
    facetError,
    listError,
    addOpen,
    setAddOpen,
    loadingMore,
    isPending,
    loadMore,
    debouncedSearch,
    productCount,
    battledCount,
    categoryCount,
    claimedCount,
    unclaimedCount,
  }
}
