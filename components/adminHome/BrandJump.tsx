'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'

type BrandHit = {
  brand_id: number
  brand_name: string
  product_count: number
  battle_count: number
  top_elo: number | null
}

export default function BrandJump() {
  const { enterAsBrand, loading } = useEnterImpersonation()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<BrandHit[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const reqId = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)

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
          const { data, error: rpcError } = await createClient().rpc('search_brands_admin', {
            p_query: q,
          })
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
        } catch {
          if (id !== reqId.current) return
          setHits([])
          setError('Search failed.')
        } finally {
          if (id === reqId.current) setSearching(false)
        }
      })()
    }, 180)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    return () => window.removeEventListener('mousedown', onPointer)
  }, [])

  async function pick(brand: BrandHit) {
    setPendingId(brand.brand_id)
    setError(null)
    try {
      const result = await enterAsBrand(brand.brand_id, '/dashboard')
      if (!result.ok) setError(result.error || 'Couldn’t enter impersonation.')
    } finally {
      setPendingId(null)
    }
  }

  const showMenu = open && (query.trim().length >= 2 || error)

  return (
    <div className="ah-jump" ref={rootRef}>
      <span className="ah-jump-icon" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M16 16.5L20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>
      <input
        className="ah-jump-input"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && hits[0] && !loading) {
            e.preventDefault()
            void pick(hits[0])
          }
        }}
        placeholder="Jump to a brand…"
        aria-label="Jump to a brand"
        autoComplete="off"
      />
      {showMenu ? (
        <div className="ah-jump-menu" role="listbox">
          {error ? <div className="ah-jump-empty">{error}</div> : null}
          {!error && searching && hits.length === 0 ? (
            <div className="ah-jump-empty">Searching…</div>
          ) : null}
          {!error && !searching && hits.length === 0 ? (
            <div className="ah-jump-empty">No brands match “{query.trim()}”.</div>
          ) : null}
          {hits.map((brand) => {
            const busy = loading && pendingId === brand.brand_id
            return (
              <button
                key={brand.brand_id}
                type="button"
                className="ah-jump-hit"
                disabled={loading}
                onClick={() => void pick(brand)}
              >
                <span>
                  <span className="ah-jump-name">{brand.brand_name}</span>
                  <span className="ah-jump-meta">
                    {brand.product_count.toLocaleString()} products · {brand.battle_count.toLocaleString()}{' '}
                    battles
                  </span>
                </span>
                <span className="ah-jump-go">{busy ? 'Entering…' : 'View as →'}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
