'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BrandSearchResult } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { useImpersonation } from '../ImpersonationContext'

export default function AdminIhutClient() {
  const router = useRouter()
  const { setViewingBrand } = useImpersonation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BrandSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const { data } = await supabase.rpc('search_brands_admin', { p_query: q.trim() })
    setSearching(false)
    setSearchResults(((data ?? []) as BrandSearchResult[]).map((r) => ({
      brand_id: r.brand_id,
      brand_name: r.brand_name,
      product_count: Number(r.product_count),
      battle_count: Number(r.battle_count),
      top_elo: r.top_elo ? Number(r.top_elo) : null,
    })))
  }

  function openBrand(brand: BrandSearchResult) {
    setViewingBrand({ brand_id: brand.brand_id, brand_name: brand.brand_name })
    router.push(`/ihut?brand_id=${brand.brand_id}`)
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 720, margin: '0 auto', padding: '36px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Admin
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
          Launch IHUT
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          Select a brand to view their IHUT studies or start a new campaign.
        </p>
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search brands..."
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--ink-10)',
          background: 'var(--white)',
          fontSize: 14,
          color: 'var(--ink)',
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      {searching && (
        <div style={{ fontSize: 13, color: 'var(--ink-30)', padding: '8px 0' }}>Searching...</div>
      )}

      {searchResults.length > 0 && (
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
          }}
        >
          {searchResults.map((brand, i) => (
            <div
              key={brand.brand_id}
              onClick={() => openBrand(brand)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < searchResults.length - 1 ? '1px solid var(--ink-10)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{brand.brand_name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                  {brand.product_count.toLocaleString()} products
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>Open IHUT →</div>
            </div>
          ))}
        </div>
      )}

      {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--ink-30)', padding: '8px 0' }}>No brands found.</div>
      )}
    </div>
  )
}
