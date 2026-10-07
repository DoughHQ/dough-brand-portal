'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  reasonLabel,
  safetyAgeLabel,
  safetyDeskHref,
  safetyIsStale,
  safetyPersonLabel,
  severityRank,
  surfaceLabel,
  type SafetyModerationAction,
  type SafetyReportRow,
} from '@/lib/safety.shared'
import {
  getSafetyReportAction,
  moderateSafetyReportAction,
  reinstateUserAction,
} from './actions'
import { formatUtcStamp } from '@/lib/portal-ui/format'
import './safetyDesk.css'

function Avatar({
  url,
  name,
  className,
}: {
  url: string | null
  name: string
  className?: string
}) {
  const letter = (name.trim().slice(0, 1) || '?').toUpperCase()
  if (url) {
    return (
      <div className={className ?? 'safety-avatar'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" />
      </div>
    )
  }
  return (
    <div className={className ?? 'safety-avatar'} aria-hidden>
      {letter}
    </div>
  )
}

export default function SafetyDeskClient({
  initialRows,
  initialTotal,
  focusId,
  loadError,
  renderedAt,
}: {
  initialRows: SafetyReportRow[]
  initialTotal: number
  focusId: number | null
  loadError: string | null
  renderedAt: number
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [selectedId, setSelectedId] = useState<number | null>(
    focusId ?? initialRows[0]?.report_id ?? null,
  )
  const [detail, setDetail] = useState<SafetyReportRow | null>(null)
  const [actions, setActions] = useState<SafetyModerationAction[]>([])
  const [note, setNote] = useState('')
  const [banner, setBanner] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
    loadError ? { tone: 'error', text: loadError } : null,
  )
  const [pending, startTransition] = useTransition()

  const selected = useMemo(
    () => rows.find((r) => r.report_id === selectedId) ?? detail,
    [rows, selectedId, detail],
  )

  const loadDetail = useCallback((reportId: number) => {
    startTransition(async () => {
      const res = await getSafetyReportAction(reportId)
      if (!res.ok || !res.report) {
        setBanner({ tone: 'error', text: res.error ?? 'Could not load that case.' })
        return
      }
      setDetail(res.report)
      setActions(res.actions ?? [])
    })
  }, [])

  useEffect(() => {
    if (selectedId == null) return
    loadDetail(selectedId)
  }, [selectedId, loadDetail])

  useEffect(() => {
    if (focusId != null && focusId !== selectedId) {
      setSelectedId(focusId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  const selectCase = (id: number) => {
    setSelectedId(id)
    setNote('')
    setBanner(null)
    router.replace(safetyDeskHref({ focusId: id }), { scroll: false })
  }

  const act = (outcome: 'dismiss' | 'remove_content' | 'suspend') => {
    if (selectedId == null) return
    startTransition(async () => {
      const res = await moderateSafetyReportAction(selectedId, outcome, note.trim() || null)
      if (!res.ok) {
        setBanner({ tone: 'error', text: res.error ?? 'Action failed.' })
        return
      }
      setRows((prev) => prev.filter((r) => r.report_id !== selectedId))
      setTotal((t) => Math.max(0, t - 1))
      setBanner({
        tone: 'ok',
        text:
          outcome === 'dismiss'
            ? 'Dismissed. Case closed.'
            : outcome === 'suspend'
              ? 'Account suspended. Avatar purge queued.'
              : 'Content removed.',
      })
      const next = rows.find((r) => r.report_id !== selectedId)
      if (next) {
        setSelectedId(next.report_id)
        router.replace(safetyDeskHref({ focusId: next.report_id }), { scroll: false })
      } else {
        setSelectedId(null)
        setDetail(null)
        setActions([])
        router.replace(safetyDeskHref(), { scroll: false })
      }
      setNote('')
    })
  }

  const reinstate = () => {
    if (!selected) return
    startTransition(async () => {
      const res = await reinstateUserAction(selected.target_user_id, note.trim() || null)
      if (!res.ok) {
        setBanner({ tone: 'error', text: res.error ?? 'Could not reinstate.' })
        return
      }
      setBanner({ tone: 'ok', text: 'Account reinstated.' })
      loadDetail(selected.report_id)
    })
  }

  const who = selected
    ? safetyPersonLabel(
        selected.target_display_name ?? selected.snapshot.display_name,
        selected.target_handle ?? selected.snapshot.handle,
        selected.target_user_id,
      )
    : ''

  return (
    <div className="safety-page">
      <div className="safety-head">
        <div>
          <div className="safety-kicker">Platform · Trust &amp; safety</div>
          <h1 className="safety-title">Safety</h1>
        </div>
        <div className="safety-meta">
          {total === 0 ? 'Inbox clear' : `${total} open`} · SLA 24h · rendered{' '}
          {formatUtcStamp(new Date(renderedAt).toISOString())}
        </div>
      </div>

      {banner ? (
        <div
          className={`safety-banner ${banner.tone === 'error' ? 'safety-banner-error' : 'safety-banner-ok'}`}
          role="status"
        >
          {banner.text}
        </div>
      ) : null}

      <div className="safety-layout">
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
      </div>
    </div>
  )
}
