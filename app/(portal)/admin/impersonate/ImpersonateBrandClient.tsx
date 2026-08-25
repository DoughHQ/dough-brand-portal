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

export default function ImpersonateBrandClient({
  currentImpersonatedBrandId,
}: {
  currentImpersonatedBrandId: number | null
}) {
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

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 720, margin: '0 auto', padding: '36px 32px 80px' }}>
      <header style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginBottom: 8,
          }}
        >
          Platform ops
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          Impersonate a brand
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55, maxWidth: 520 }}>
          Search any brand and open their portal Home. Uses the same session claim path as Products —
          the “VIEWING AS” banner will show until you exit.
        </p>
      </header>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brands by name…"
          aria-label="Search brands to impersonate"
          autoFocus
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--ink-10)',
            background: 'var(--white)',
            fontSize: 15,
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {searching ? (
          <div
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              color: 'var(--ink-30)',
              pointerEvents: 'none',
            }}
          >
            Searching…
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          style={{
            fontSize: 13,
            color: 'var(--clay, #a6543c)',
            marginBottom: 12,
            padding: '10px 12px',
            background: 'var(--cream, #faf8f3)',
            borderRadius: 8,
            border: '1px solid var(--ink-10)',
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: 120,
        }}
      >
        {query.trim().length < 2 ? (
          <div style={{ padding: '28px 20px', fontSize: 13, color: 'var(--ink-30)', lineHeight: 1.5 }}>
            Type at least 2 characters to search.
          </div>
        ) : hits.length === 0 && searching ? (
          <div style={{ padding: '28px 20px', fontSize: 13, color: 'var(--ink-30)' }}>Searching…</div>
        ) : hits.length === 0 ? (
          <div style={{ padding: '28px 20px', fontSize: 13, color: 'var(--ink-30)' }}>
            No brands match “{query.trim()}”.
          </div>
        ) : (
          hits.map((brand, i) => {
            const active = currentImpersonatedBrandId === brand.brand_id
            const busy = entering && pendingId === brand.brand_id
            return (
              <button
                key={brand.brand_id}
                type="button"
                disabled={entering}
                onClick={() => void pick(brand)}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '14px 18px',
                  border: 'none',
                  borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
                  background: active ? 'var(--sage-pale, #eef5f0)' : 'transparent',
                  cursor: entering ? 'wait' : 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  opacity: searching ? 0.85 : 1,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                    {brand.brand_name}
                    {active ? (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: 'var(--sage)',
                        }}
                      >
                        Current
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 3 }}>
                    {brand.product_count.toLocaleString()} products
                    {' · '}
                    {brand.battle_count.toLocaleString()} battles
                    {brand.top_elo != null ? ` · top Elo ${Math.round(brand.top_elo)}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sage)', flexShrink: 0 }}>
                  {busy ? 'Entering…' : active ? 'Re-enter →' : 'View as brand →'}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
