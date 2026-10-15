import type { MilestoneAlert } from '@/lib/queries'
import { milestoneLabel } from './adminProductModel'
import type { useAdminProducts } from './useAdminProducts'

export function AdminMilestoneAlerts({
  milestoneAlerts,
  router,
}: {
  milestoneAlerts: MilestoneAlert[]
  router: ReturnType<typeof useAdminProducts>['router']
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 14 }}>
        Milestone alerts
      </div>
      <div style={{
        background: 'var(--paper)',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}>
        {milestoneAlerts.length === 0 && (
          <div style={{ padding: 20, fontSize: 12, color: 'var(--ink-30)' }}>No new milestones.</div>
        )}
        {milestoneAlerts.map((alert, i) => (
          <div
            key={alert.alert_id}
            style={{
              padding: '14px 18px',
              borderBottom: i < milestoneAlerts.length - 1 ? '1px solid var(--ink-10)' : 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => router.push(`/products/${alert.product_id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {alert.products?.product_name_clean ?? `Product ${alert.product_id}`}
              </div>
              <div style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--sage)',
                background: 'var(--sage-pale)',
                padding: '2px 8px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {milestoneLabel[alert.milestone_type] ?? alert.milestone_type}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-50)' }}>
              {alert.brands?.brand_name ?? ''}
              {alert.win_rate_at_trigger != null && ` · ${alert.win_rate_at_trigger}% win rate`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
