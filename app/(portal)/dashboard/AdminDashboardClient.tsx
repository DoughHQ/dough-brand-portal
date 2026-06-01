'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PortalUser, PlatformStats, BrandSearchResult } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { useImpersonation } from '../ImpersonationContext'

interface Props {
  portalUser: PortalUser
  stats: PlatformStats
}

export default function AdminDashboardClient({ portalUser, stats }: Props) {
  const router = useRouter()
  const { setViewingBrand } = useImpersonation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BrandSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase.rpc('search_brands_admin', { p_query: q.trim() })
    setSearching(false)
    setSearchResults(((data ?? []) as any[]).map((r: any) => ({
      brand_id: r.brand_id,
      brand_name: r.brand_name,
      product_count: Number(r.product_count),
      battle_count: Number(r.battle_count),
      top_elo: r.top_elo ? Number(r.top_elo) : null,
    })))
  }

  const statCards = [
    { label: 'Brands in database', value: stats.active_brands.toLocaleString() },
    { label: 'Active products', value: stats.active_products.toLocaleString() },
    { label: 'Total battles', value: stats.total_battles.toLocaleString(), sub: `${stats.battles_7d} last 7 days` },
    { label: 'Total scans', value: stats.total_scans.toLocaleString(), sub: `${stats.scans_7d} last 7 days` },
    { label: 'Registered users', value: stats.total_users.toLocaleString(), sub: `${stats.active_users_7d} active this week` },
    { label: 'Products with ELO', value: stats.products_with_elo.toLocaleString() },
    { label: 'Avg decision time', value: `${(stats.avg_decision_ms / 1000).toFixed(1)}s` },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Admin
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
          Platform overview
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 6 }}>
          Live data · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Platform stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 36 }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '20px 20px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--ink-50)', marginBottom: 8, fontWeight: 400 }}>
              {card.label}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
              {card.value}
            </div>
            {card.sub && (
              <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 6 }}>{card.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Brand search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>
          Brand search
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search any brand..."
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
          }}
          onFocus={e => e.target.style.borderColor = 'var(--ink-30)'}
          onBlur={e => e.target.style.borderColor = 'var(--ink-10)'}
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
          marginBottom: 36,
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 120px 120px 80px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--ink-10)',
            background: 'var(--surface-1)',
          }}>
            {['Brand', 'Products', 'Battles', 'Top ELO', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {h}
              </div>
            ))}
          </div>
          {searchResults.map((brand, i) => (
            <div
              key={brand.brand_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 120px 80px',
                padding: '14px 20px',
                borderBottom: i < searchResults.length - 1 ? '1px solid var(--ink-10)' : 'none',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => {
                setViewingBrand({ brand_id: brand.brand_id, brand_name: brand.brand_name })
                router.push(`/dashboard?brand_id=${brand.brand_id}`)
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{brand.brand_name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>{brand.product_count.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: brand.battle_count > 0 ? 'var(--ink)' : 'var(--ink-30)', fontWeight: brand.battle_count > 0 ? 500 : 400 }}>
                {brand.battle_count > 0 ? brand.battle_count.toLocaleString() : '—'}
              </div>
              <div style={{ fontSize: 13, color: brand.top_elo ? 'var(--ink)' : 'var(--ink-30)' }}>
                {brand.top_elo ? Math.round(brand.top_elo) : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>
                View as brand →
              </div>
            </div>
          ))}
        </div>
      )}

      {searching && (
        <div style={{ fontSize: 13, color: 'var(--ink-30)', padding: '16px 0' }}>Searching...</div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'All products', sub: `${stats.products_with_elo.toLocaleString()} with ELO data`, href: '/products' },
          { label: 'Waitlist', sub: 'Review brand access requests', href: '/waitlist' },
          { label: 'Platform health', sub: 'Pipeline status · Data freshness', href: '/health' },
        ].map(item => (
          <div
            key={item.label}
            onClick={() => router.push(item.href)}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              padding: '20px 20px',
              cursor: 'pointer',
              transition: 'border-color 0.12s var(--ease)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink-30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ink-10)')}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
