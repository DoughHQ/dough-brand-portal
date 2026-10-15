import {
  reasonLabel,
  safetyAgeLabel,
  safetyIsStale,
  safetyPersonLabel,
  severityRank,
  surfaceLabel,
  type SafetyReportRow,
} from '@/lib/safety.shared'
import { Avatar } from './SafetyAvatar'

export function SafetyQueue({
  rows,
  selectedId,
  selectCase,
}: {
  rows: SafetyReportRow[]
  selectedId: number | null
  selectCase: (id: number) => void
}) {
  return (
      <div className="safety-queue" role="list" aria-label="Open safety reports">
        {rows.length === 0 ? (
          <div className="safety-empty">No open reports. Nice.</div>
        ) : (
          rows.map((row) => {
            const label = safetyPersonLabel(
              row.target_display_name ?? row.snapshot.display_name,
              row.target_handle ?? row.snapshot.handle,
              row.target_user_id,
            )
            const stale = safetyIsStale(row.created_at)
            const hot = severityRank(row.reason) === 0
            return (
              <button
                key={row.report_id}
                type="button"
                role="listitem"
                className={`safety-queue-item${selectedId === row.report_id ? ' is-active' : ''}${stale ? ' is-stale' : ''}${hot ? ' is-hot' : ''}`}
                onClick={() => selectCase(row.report_id)}
              >
                <Avatar
                  url={row.target_avatar_url ?? row.snapshot.avatar_url ?? null}
                  name={label}
                />
                <div className="safety-queue-body">
                  <div className="safety-queue-top">
                    <div className="safety-name">{label}</div>
                    <div className="safety-age">{safetyAgeLabel(row.created_at)}</div>
                  </div>
                  <div className="safety-reason">{reasonLabel(row.reason)}</div>
                  <div className="safety-sub">
                    {surfaceLabel(row.surface)}
                    {row.prior_reports_on_target > 0
                      ? ` · ${row.prior_reports_on_target} prior`
                      : ''}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
  )
}
