'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'
import type { ProductResult } from './adminProductModel'

export function useAdminProducts() {
  const router = useRouter()
  const { enterAsBrand, loading: entering } = useEnterImpersonation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductResult[]>([])
  const [searching, setSearching] = useState(false)
  const [productIdJump, setProductIdJump] = useState('')

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await createClient().rpc('search_products_admin', { p_query: q.trim() })
    setSearching(false)
    setSearchResults((data ?? []) as ProductResult[])
  }

  function openById() {
    const id = parseInt(productIdJump.trim(), 10)
    if (!Number.isNaN(id) && id > 0) {
      router.push(`/products/${id}`)
    }
  }

  return {
    router,
    enterAsBrand,
    entering,
    searchQuery,
    searchResults,
    searching,
    productIdJump,
    setProductIdJump,
    handleSearch,
    openById,
  }
}
