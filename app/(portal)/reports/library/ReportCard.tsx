import { useRouter } from 'next/navigation'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import { REPORT_TYPE_LABELS, type Report } from './reportsModel'

export function ReportCard({ report, unlocked, isAdmin, brandCategoryIds }: {
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
