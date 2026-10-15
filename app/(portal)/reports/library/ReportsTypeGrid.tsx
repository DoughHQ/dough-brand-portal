import { ReportCard } from './ReportCard'
import type { Report } from './reportsModel'

export function ReportsTypeGrid({
  filtered,
  isAdmin,
  purchasedIds,
  sortReports,
  brandCategoryIds,
}: {
  filtered: Report[]
  isAdmin: boolean
  purchasedIds: Set<number>
  sortReports: (reportList: Report[]) => Report[]
  brandCategoryIds: Set<number>
}) {
  return (
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
  )
}
