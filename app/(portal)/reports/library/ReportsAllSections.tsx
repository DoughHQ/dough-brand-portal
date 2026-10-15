import { ReportCard } from './ReportCard'
import { REPORT_TYPE_LABELS, type Report } from './reportsModel'

export function ReportsAllSections({
  reports,
  search,
  isAdmin,
  purchasedIds,
  sortReports,
  brandCategoryIds,
  brandName,
}: {
  reports: Report[]
  search: string
  isAdmin: boolean
  purchasedIds: Set<number>
  sortReports: (reportList: Report[]) => Report[]
  brandCategoryIds: Set<number>
  brandName: string
}) {
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
            Licensed to {brandName} for internal use.
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
}
