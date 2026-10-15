'use client'
import type { Brand } from '@/lib/queries'
import ReportsSkeleton from '@/components/reports/reports_skeleton'
import '@/components/reports/reports_skeleton.css'
import './reportsPage.css'
import { ReportsAllSections } from './library/ReportsAllSections'
import { ReportsHeader } from './library/ReportsHeader'
import { ReportsToolbar } from './library/ReportsToolbar'
import { ReportsTypeGrid } from './library/ReportsTypeGrid'
import { useReportsLibrary } from './library/useReportsLibrary'

interface Props {
  brand: Brand
  isAdmin: boolean
  brandId: number
  /** Cold L2 ids from brand_home_catalog_stats — not a products census. */
  brandCategoryIds?: number[]
}

export default function ReportsClient({ brand, isAdmin, brandId, brandCategoryIds: brandCategoryIdsProp = [] }: Props) {
  const library = useReportsLibrary({ brandId, brandCategoryIdsProp })
  const { loading, filterType, filtered } = library

  return (
    <div className="reports-page">
      <ReportsHeader isAdmin={isAdmin} brandName={brand.brand_name} />

      <ReportsToolbar
        search={library.search}
        setSearch={library.setSearch}
        filterType={filterType}
        setFilterType={library.setFilterType}
      />

      {loading && <ReportsSkeleton embedded />}

      {!loading && filterType === 'all' && (
        <ReportsAllSections
          reports={library.reports}
          search={library.search}
          isAdmin={isAdmin}
          purchasedIds={library.purchasedIds}
          sortReports={library.sortReports}
          brandCategoryIds={library.brandCategoryIds}
          brandName={brand.brand_name}
        />
      )}

      {!loading && filterType !== 'all' && (
        <ReportsTypeGrid
          filtered={filtered}
          isAdmin={isAdmin}
          purchasedIds={library.purchasedIds}
          sortReports={library.sortReports}
          brandCategoryIds={library.brandCategoryIds}
        />
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
