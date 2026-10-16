import {
  reasonLabel,
  safetyIsStale,
  safetyPersonLabel,
  severityRank,
  surfaceLabel,
  type SafetyModerationAction,
  type SafetyReportRow,
} from '@/lib/safety.shared'
import { formatUtcStamp } from '@/lib/portal-ui/format'
import { Avatar } from './SafetyAvatar'

export function SafetyCase({
  selected,
  who,
  actions,
  note,
  setNote,
  pending,
  act,
  reinstate,
}: {
  selected: SafetyReportRow | null
  who: string
  actions: SafetyModerationAction[]
  note: string
  setNote: (value: string) => void
  pending: boolean
  act: (outcome: 'dismiss' | 'remove_content' | 'suspend') => void
  reinstate: () => void
}) {
  return (
    <div className="safety-case">
      {!selected ? (
        <div className="safety-empty">Select a case.</div>
      ) : (
        <>
          <div className="safety-case-head">
            <Avatar
              url={selected.target_avatar_url ?? selected.snapshot.avatar_url ?? null}
              name={who}
            />
            <div>
              <h2 className="safety-case-title">{who}</h2>
              <div className="safety-sub">
                user_id {selected.target_user_id}
                {selected.target_user_status
                  ? ` · ${selected.target_user_status}`
                  : ''}
                {' · '}
                reported {formatUtcStamp(selected.created_at)}
              </div>
            </div>
          </div>

          <div className="safety-pill-row">
            <span className={`safety-pill${severityRank(selected.reason) === 0 ? ' is-hot' : ''}`}>
              {reasonLabel(selected.reason)}
            </span>
            <span className="safety-pill">{surfaceLabel(selected.surface)}</span>
            {safetyIsStale(selected.created_at) ? (
              <span className="safety-pill is-warn">Stale · over 12h</span>
            ) : null}
            {selected.prior_reports_on_target > 0 ? (
              <span className="safety-pill is-warn">
                {selected.prior_reports_on_target} prior on this person
              </span>
            ) : null}
            {selected.alert_dispatched_at ? (
              <span className="safety-pill">Alert sent</span>
            ) : (
              <span className="safety-pill is-warn">Alert pending</span>
            )}
          </div>

          <div className="safety-section">
            <h3>Snapshot at report</h3>
            <div className="safety-snapshot">
              {[
                selected.snapshot.display_name
                  ? `Name: ${selected.snapshot.display_name}`
                  : null,
                selected.snapshot.handle ? `Handle: @${selected.snapshot.handle}` : null,
                selected.snapshot.bio ? `Bio: ${selected.snapshot.bio}` : null,
                selected.snapshot.rec_note
                  ? `Rec note: ${selected.snapshot.rec_note}`
                  : null,
                selected.snapshot.saved_note
                  ? `Saved note: ${selected.snapshot.saved_note}`
                  : null,
                selected.snapshot.product_id
                  ? `Product: ${selected.snapshot.product_id}`
                  : null,
                selected.note ? `Reporter note: ${selected.note}` : null,
                `Reporter: ${safetyPersonLabel(selected.reporter_display_name, selected.reporter_handle, selected.reporter_id)}`,
              ]
                .filter(Boolean)
                .join('\n') || 'No text in snapshot.'}
            </div>
            {selected.snapshot.avatar_url ? (
              <div style={{ marginTop: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo */}
                <img
                  src={selected.snapshot.avatar_url}
                  alt=""
                  style={{
                    maxWidth: 160,
                    maxHeight: 160,
                    borderRadius: 8,
                    objectFit: 'cover',
                  }}
                />
              </div>
            ) : null}
          </div>

          {actions.length > 0 ? (
            <div className="safety-section">
              <h3>Audit</h3>
              <ul className="safety-timeline">
                {actions.map((a) => (
                  <li key={a.action_id}>
                    <strong>{a.action}</strong> · {a.actor_role} ·{' '}
                    {formatUtcStamp(a.created_at)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <label className="safety-section" style={{ display: 'block' }}>
            <h3>Moderator note</h3>
            <textarea
              className="safety-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional — stored on the audit row"
              maxLength={500}
              disabled={pending || selected.status !== 'open'}
            />
          </label>

          {selected.status === 'open' ? (
            <div className="safety-actions">
              <button
                type="button"
                className="safety-btn is-primary"
                disabled={pending}
                onClick={() => act('dismiss')}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="safety-btn"
                disabled={pending}
                onClick={() => act('remove_content')}
              >
                Remove content
              </button>
              <button
                type="button"
                className="safety-btn is-danger"
                disabled={pending}
                onClick={() => {
                  if (
                    typeof window !== 'undefined' &&
                    !window.confirm(
                      `Suspend ${who}? They lose access immediately. Profile is scrubbed.`,
                    )
                  ) {
                    return
                  }
                  act('suspend')
                }}
              >
                Suspend
              </button>
            </div>
          ) : selected.target_user_status === 'suspended' ? (
            <div className="safety-actions">
              <button
                type="button"
                className="safety-btn is-primary"
                disabled={pending}
                onClick={reinstate}
              >
                Reinstate account
              </button>
            </div>
          ) : (
            <div className="safety-sub">Case already closed ({selected.status}).</div>
          )}
        </>
      )}
    </div>
  )
}
