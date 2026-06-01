'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { PortalUser, Brand, BrandSubscription } from '@/lib/queries'

type Report = {
  report_catalog_id: number
  report_type: string
  title: string
  description: string | null
  taxonomy_node_id: number | null
  taxonomy_level: string | null
  time_window_days: number
  min_battles: number
  verified_only: boolean
  price_cents: number
  category_name: string | null
}

type Purchase = {
  report_catalog_id: number
}

interface Props {
  portalUser: PortalUser
  brand: Brand
  subscription: BrandSubscription | null
  isAdmin: boolean
  isImpersonating: boolean
  brandId: number
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  category_ranking: 'Category Rankings',
  health_benchmark: 'Health Benchmarks',
  brand_scorecard: 'Brand Scorecard',
  competitive_set: 'Competitive Set',
}

export default function ReportsClient({ portalUser, brand, subscription, isAdmin, isImpersonating, brandId }: Props) {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [brandCategoryIds, setBrandCategoryIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('report_catalog')
        .select('*')
        .eq('is_published', true)
        .order('report_catalog_id')
        .then(({ data, error }) => {
          if (error) console.error('reports fetch error:', error)
          setReports((data ?? []) as Report[])
        }),
      supabase
        .from('report_purchases')
        .select('report_catalog_id')
        .eq('brand_id', brandId)
        .then(({ data }) => setPurchases((data ?? []) as Purchase[])),
      supabase
        .from('products')
        .select('taxonomy_node_id, taxonomy_nodes!products_taxonomy_node_id_fkey(parent_taxonomy_node_id)')
        .eq('brand_id', brandId)
        .eq('status', 'active')
        .eq('is_suppressed', false)
        .then(({ data }) => {
          const parentIds = new Set<number>()
          ;(data ?? []).forEach((row: { taxonomy_nodes?: { parent_taxonomy_node_id?: number } | { parent_taxonomy_node_id?: number }[] | null }) => {
            const nodes = row.taxonomy_nodes
            const parentId = Array.isArray(nodes) ? nodes[0]?.parent_taxonomy_node_id : nodes?.parent_taxonomy_node_id
            if (parentId) parentIds.add(Number(parentId))
          })
          setBrandCategoryIds(parentIds)
        }),
    ]).then(() => setLoading(false))
  }, [brandId])

  const purchasedIds = new Set(purchases.map(p => p.report_catalog_id))

  const filtered = reports.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || r.report_type === filterType
    return matchesSearch && matchesType
  })

  function sortReports(reportList: Report[]) {
    return [...reportList].sort((a, b) => {
      const aRelevant = a.taxonomy_node_id && brandCategoryIds.has(a.taxonomy_node_id) ? 1 : 0
      const bRelevant = b.taxonomy_node_id && brandCategoryIds.has(b.taxonomy_node_id) ? 1 : 0
      if (bRelevant !== aRelevant) return bRelevant - aRelevant
      return a.report_catalog_id - b.report_catalog_id
    })
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      {isImpersonating && (
        <div style={{
          background: 'var(--amber-pale)',
          border: '1px solid rgba(192,120,24,0.2)',
          borderRadius: 'var(--r-md)',
          padding: '10px 16px',
          marginBottom: 24,
          fontSize: 12,
          color: 'var(--amber)',
        }}>
          Viewing as {brand.brand_name} — this is exactly what they see.
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          {isAdmin ? 'Admin' : brand.brand_name}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
          Intelligence Reports
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', maxWidth: 540, lineHeight: 1.6 }}>
          Category-level preference data, ranked by real consumer battles.
          Reports reflect declared preference — not surveys, not panels.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search reports..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
            background: 'var(--white)',
            fontSize: 13,
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--ink-30)'}
          onBlur={e => e.target.style.borderColor = 'var(--ink-10)'}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'category_ranking', 'health_benchmark', 'brand_scorecard'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--r-sm)',
                fontSize: 12,
                fontWeight: filterType === type ? 500 : 400,
                color: filterType === type ? 'var(--ink)' : 'var(--ink-50)',
                background: filterType === type ? 'var(--white)' : 'transparent',
                border: filterType === type ? '1px solid var(--ink-10)' : '1px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap',
              }}
            >
              {type === 'all' ? 'All reports' : REPORT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: 'var(--ink-30)', padding: '40px 0', textAlign: 'center' }}>
          Loading reports...
        </div>
      )}

      {!loading && filterType === 'all' && (() => {
        const typeOrder = ['category_ranking', 'health_benchmark', 'competitive_set', 'brand_scorecard']
        const searchFiltered = reports.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()))
        const allOwned = sortReports(searchFiltered.filter(r => isAdmin || purchasedIds.has(r.report_catalog_id)))
        const allAvailable = sortReports(searchFiltered.filter(r => !isAdmin && !purchasedIds.has(r.report_catalog_id)))

        return (
          <>
            {typeOrder.map(type => {
              const typeReports = allOwned.filter(r => r.report_type === type)
              if (typeReports.length === 0) return null
              return (
                <div key={type} style={{ marginBottom: 36 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
                    {REPORT_TYPE_LABELS[type]}
                    <span style={{ fontSize: 11, color: 'var(--ink-30)', fontWeight: 400, marginLeft: 8 }}>
                      {typeReports.length} reports
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {typeReports.map(report => (
                      <ReportCard key={report.report_catalog_id} report={report} unlocked={true} isAdmin={isAdmin} brandCategoryIds={brandCategoryIds} />
                    ))}
                  </div>
                </div>
              )
            })}

            {allAvailable.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                  Available to purchase
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginBottom: 16, lineHeight: 1.6 }}>
                  Generated from real battle data. Delivered instantly.
                  Licensed to {brand.brand_name} for internal use.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                  {allAvailable.map(report => (
                    <ReportCard key={report.report_catalog_id} report={report} unlocked={false} isAdmin={isAdmin} brandCategoryIds={brandCategoryIds} />
                  ))}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {!loading && filterType !== 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {sortReports(filtered).map(report => (
            <ReportCard
              key={report.report_catalog_id}
              report={report}
              unlocked={isAdmin || purchasedIds.has(report.report_catalog_id)}
              isAdmin={isAdmin}
              brandCategoryIds={brandCategoryIds}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-30)' }}>
              No reports of this type yet.
            </div>
          )}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--ink-30)' }}>
            No reports match your search.
          </div>
        </div>
      )}

    </div>
  )
}

function ReportCard({ report, unlocked, isAdmin, brandCategoryIds }: {
  report: Report
  unlocked: boolean
  isAdmin: boolean
  brandCategoryIds: Set<number>
}) {
  const typeLabel = REPORT_TYPE_LABELS[report.report_type] ?? report.report_type
  const price = `$${(report.price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
  const isRelevant = report.taxonomy_node_id != null && brandCategoryIds.has(report.taxonomy_node_id)

  const includes = [
    `${report.time_window_days}d battle window`,
    `${report.min_battles}+ battles required`,
    report.verified_only ? 'Verified products only' : 'All products included',
    'ELO rankings + win rates',
    'Health percentiles',
  ]

  return (
    <div style={{
      background: 'var(--white)',
      border: `1px solid ${unlocked ? 'var(--sage)' : 'var(--ink-10)'}`,
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <div style={{ padding: '20px 22px', flex: 1 }}>

        <div style={{ marginBottom: 12 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 500,
            color: unlocked ? 'var(--sage)' : 'var(--ink-30)',
            background: unlocked ? 'var(--sage-pale)' : 'var(--surface-1)',
            padding: '2px 9px',
            borderRadius: 20,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {typeLabel}
          </span>
          {isRelevant && (
            <span style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 500,
              color: 'var(--sage)',
              background: 'var(--sage-pale)',
              padding: '2px 9px',
              borderRadius: 20,
              letterSpacing: '0.04em',
              marginLeft: 6,
              textTransform: 'uppercase',
            }}>
              Your category
            </span>
          )}
        </div>

        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          fontWeight: 400,
          color: 'var(--ink)',
          lineHeight: 1.3,
          marginBottom: 8,
        }}>
          {report.title}
        </div>

        {report.description && (
          <div style={{
            fontSize: 12,
            color: 'var(--ink-50)',
            lineHeight: 1.6,
            marginBottom: 16,
          }}>
            {report.description}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {includes.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: unlocked ? 'var(--sage)' : 'var(--ink-10)',
                flexShrink: 0,
              }} />
              <div style={{ fontSize: 12, color: unlocked ? 'var(--ink-50)' : 'var(--ink-30)' }}>
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '14px 22px',
        borderTop: '1px solid var(--ink-10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: unlocked ? 'var(--sage-pale)' : 'var(--surface-1)',
      }}>
        {unlocked ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 500 }}>
              {isAdmin ? 'Admin access' : 'Purchased'}
            </div>
            <button
              style={{
                padding: '7px 16px',
                background: 'var(--sage)',
                color: 'white',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 'var(--r-sm)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onClick={() => alert('Report viewer coming soon')}
            >
              View report
            </button>
          </>
        ) : (
          <>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--ink)' }}>
                {price}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-30)', marginTop: 1 }}>
                One-time · Perpetual license
              </div>
            </div>
            <button
              style={{
                padding: '7px 16px',
                background: 'var(--ink)',
                color: 'white',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 'var(--r-sm)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onClick={() => alert(`Purchase flow for report ${report.report_catalog_id} — coming soon`)}
            >
              Purchase
            </button>
          </>
        )}
      </div>
    </div>
  )
}
