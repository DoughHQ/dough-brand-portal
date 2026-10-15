'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'

export type ImpersonateBrandHit = {
  brand_id: number
  brand_name: string
  product_count: number
  battle_count: number
  top_elo: number | null
}

export function useImpersonateSearch() {
  const { enterAsBrand, loading: entering } = useEnterImpersonation()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<ImpersonateBrandHit[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const reqId = useRef(0)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      return
    }

    const id = ++reqId.current
    setSearching(true)
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const { data, error: rpcError } = await createClient().rpc(
            'search_brands_admin',
            { p_query: q }
          )
          if (id !== reqId.current) return
          if (rpcError) {
            setHits([])
            setError(rpcError.message || 'Search failed.')
          } else {
            setError(null)
            setHits(
              ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
                brand_id: Number(r.brand_id),
                brand_name: String(r.brand_name ?? `Brand ${r.brand_id}`),
                product_count: Number(r.product_count) || 0,
                battle_count: Number(r.battle_count) || 0,
                top_elo: r.top_elo != null ? Number(r.top_elo) : null,
              }))
            )
          }
          setSearching(false)
        } catch {
          if (id !== reqId.current) return
          setHits([])
          setSearching(false)
          setError('Search failed.')
        }
      })()
    }, 180)

    return () => {
      window.clearTimeout(t)
    }
  }, [query])

  async function pick(brand: ImpersonateBrandHit) {
    setError(null)
    setPendingId(brand.brand_id)
    try {
      const result = await enterAsBrand(brand.brand_id, '/dashboard')
      if (!result.ok) {
        setError(result.error || 'Couldn’t enter impersonation.')
      }
    } finally {
      setPendingId(null)
    }
  }

  return { entering, query, setQuery, hits, searching, error, pendingId, pick }
}
