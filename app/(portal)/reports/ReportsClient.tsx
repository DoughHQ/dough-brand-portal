'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Brand } from '@/lib/queries'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import ReportsSkeleton from '@/components/reports/reports_skeleton'
import '@/components/reports/reports_skeleton.css'
import './reportsPage.css'

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
  brand: Brand
  isAdmin: boolean
  isImpersonating: boolean
  brandId: number
  /** Cold L2 ids from brand_home_catalog_stats — not a products census. */
  brandCategoryIds?: number[]
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  category_ranking: 'Category Rankings',
  health_benchmark: 'Health Benchmarks',
  brand_scorecard: 'Brand Scorecard',
  competitive_set: 'Competitive Set',
}

export default function ReportsClient({ brand, isAdmin, isImpersonating, brandId, brandCategoryIds: brandCategoryIdsProp = [] }: Props) {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [brandCategoryIds] = useState<Set<number>>(() => new Set(brandCategoryIdsProp))
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
    ]).then(() => setLoading(false))
  }, [brandId, supabase])

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
    <div className="reports-page">

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

      <header className="reports-header">
        <div>
          <div className="reports-eyebrow">
            {isAdmin ? 'Admin' : brand.brand_name}
          </div>
          <h1 className="reports-title reports-title-sr">Reports</h1>
          <p className="reports-lede">
            Category-level preference data, ranked by real consumer battles.
            Reports reflect declared preference — not surveys, not panels.
          </p>
        </div>
      </header>

      <div className="reports-toolbar">
        <input
          type="text"
          className="reports-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search reports…"
        />
        <div className="reports-filters">
          {['all', 'category_ranking', 'health_benchmark', 'brand_scorecard'].map(type => (
            <button
              key={type}
              type="button"
              className={`reports-filter${filterType === type ? ' is-on' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'All reports' : REPORT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {loading && <ReportsSkeleton embedded />}

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
                <div key={type} className="reports-section">
                  <h2 className="reports-section-title">
                    {REPORT_TYPE_LABELS[type]}
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 500, marginLeft: 8 }}>
                      {typeReports.length}
                    </span>
                  </h2>
                  <div className="reports-grid">
                    {typeReports.map(report => (
                      <ReportCard key={report.report_catalog_id} report={report} unlocked={true} isAdmin={isAdmin} brandCategoryIds={brandCategoryIds} />
                    ))}
                  </div>
                </div>
              )
            })}

            {allAvailable.length > 0 && (
              <div className="reports-section">
                <h2 className="reports-section-title">Available to purchase</h2>
                <p className="reports-lede" style={{ marginBottom: 16 }}>
                  Generated from real battle data. Delivered instantly.
                  Licensed to {brand.brand_name} for internal use.
                </p>
                <div className="reports-grid">
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
        <div className="reports-grid">
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
            <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-faint)' }}>
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
  const router = useRouter()
  const typeLabel = REPORT_TYPE_LABELS[report.report_type] ?? report.report_type
  const price = `$${(report.price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
  const isRelevant = report.taxonomy_node_id != null && brandCategoryIds.has(report.taxonomy_node_id)
  const overviewHref =
    report.report_type === 'category_ranking' && report.taxonomy_node_id != null
      ? brandCategoryOverviewHref(report.taxonomy_node_id)
      : null

  const includes = [
    `${report.time_window_days}d battle window`,
    `${report.min_battles}+ battles required`,
    report.verified_only ? 'Verified products only' : 'All products included',
    'ELO rankings + win rates',
    'Health percentiles',
  ]

  return (
    <div
      className="portal-panel"
      style={{
        borderColor: unlocked ? 'rgba(62, 107, 74, 0.35)' : undefined,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

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
              type="button"
              className="portal-btn portal-btn-cta"
              style={{ minHeight: 34, padding: '0 14px', fontSize: 12 }}
              onClick={() => {
                if (overviewHref) router.push(overviewHref)
                else router.push('/categories')
              }}
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
              type="button"
              className="portal-btn portal-btn-cta"
              style={{ minHeight: 34, padding: '0 14px', fontSize: 12 }}
              onClick={() =>
                alert('Purchase coming soon — checkout is not live yet.')
              }
            >
              Purchase
            </button>
          </>
        )}
      </div>
    </div>
  )
}
