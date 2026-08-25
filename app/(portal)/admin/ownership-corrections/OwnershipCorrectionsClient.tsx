'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  changeSummary,
  fetchConglomerateNames,
  liveParentLabel,
  safeEvidenceHref,
  type PendingOwnershipCorrection,
} from '@/lib/ownershipCorrections'
import {
  listPendingOwnershipCorrectionsAction,
  reviewOwnershipCorrectionAction,
} from './actions'

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function OwnershipCorrectionsClient({
  initialRows,
  initialError,
}: {
  initialRows: PendingOwnershipCorrection[]
  initialError?: string | null
}) {
  const [rows, setRows] = useState(initialRows)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const [staleConfirmId, setStaleConfirmId] = useState<string | null>(null)
  const [liveNames, setLiveNames] = useState<Map<number, string>>(new Map())

  const staleLiveIds = useMemo(
    () =>
      rows
        .filter((r) => r.snapshot_is_stale && r.live_conglomerate_id != null)
        .map((r) => r.live_conglomerate_id as number),
    [rows]
  )

  useEffect(() => {
    if (staleLiveIds.length === 0) return
    void fetchConglomerateNames(staleLiveIds).then(setLiveNames)
  }, [staleLiveIds])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 4000)
    return () => window.clearTimeout(t)
  }, [flash])

  const refresh = useCallback(async () => {
    const res = await listPendingOwnershipCorrectionsAction()
    if (!res.ok) {
      setError(res.error ?? 'Couldn’t refresh the queue.')
      return
    }
    setRows(res.rows ?? [])
    setError(null)
  }, [])

  const removeRow = useCallback((correctionId: string) => {
    setRows((prev) => prev.filter((r) => r.correction_id !== correctionId))
    setNotesById((prev) => {
      const next = { ...prev }
      delete next[correctionId]
      return next
    })
    setStaleConfirmId((id) => (id === correctionId ? null : id))
  }, [])

  const decide = useCallback(
    async (
      row: PendingOwnershipCorrection,
      decision: 'accept' | 'reject',
      overrideStale: boolean
    ) => {
      setBusyId(row.correction_id)
      setError(null)
      const res = await reviewOwnershipCorrectionAction({
        correctionId: row.correction_id,
        decision,
        reviewNotes: notesById[row.correction_id] ?? null,
        overrideStale,
      })
      setBusyId(null)

      if (!res.ok) {
        if (res.code === 'stale_snapshot') {
          setStaleConfirmId(row.correction_id)
          setError(res.error ?? null)
          return
        }
        if (res.code === 'cannot_review_superseded' || res.code === 'correction_not_found') {
          removeRow(row.correction_id)
          setFlash(res.error ?? 'Removed from queue.')
          if (res.code === 'correction_not_found') void refresh()
          return
        }
        setError(res.error ?? 'Couldn’t complete the review. Try again.')
        return
      }

      removeRow(row.correction_id)
      if (res.result?.idempotent_noop) {
        setFlash('Already reviewed by someone else — removed from queue.')
      } else {
        setFlash(decision === 'accept' ? 'Accepted and applied.' : 'Rejected.')
      }
      setStaleConfirmId(null)
    },
    [notesById, removeRow, refresh]
  )

  function onAcceptClick(row: PendingOwnershipCorrection) {
    if (row.snapshot_is_stale) {
      setStaleConfirmId(row.correction_id)
      setError(null)
      return
    }
    void decide(row, 'accept', false)
  }

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '36px 32px 96px',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--ink-30)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Ops
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--ink)',
            marginBottom: 8,
          }}
        >
          Brand ownership corrections
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, maxWidth: 640, margin: 0 }}>
          Review brand-submitted parent corrections. Accepting updates the brand’s recorded parent;
          the displayed parent for brands does not change until you accept.
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link
            href="/admin/corrections"
            style={{ fontSize: 12, color: 'var(--sage)', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Product corrections
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            style={{
              fontSize: 12,
              color: 'var(--ink-50)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {flash ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--sage-soft, rgba(74, 103, 65, 0.12))',
            color: 'var(--sage-dark, var(--sage))',
            fontSize: 13,
          }}
        >
          {flash}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(180, 35, 24, 0.08)',
            color: 'var(--red, #b42318)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 12,
            padding: '48px 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            Queue is clear
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.5 }}>
            No pending brand ownership corrections right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((row) => {
            const busy = busyId === row.correction_id
            const evidenceHref = safeEvidenceHref(row.evidence_url)
            const confirmingStale = staleConfirmId === row.correction_id
            const liveLabel = liveParentLabel(row, liveNames)

            return (
              <article
                key={row.correction_id}
                style={{
                  background: 'var(--white)',
                  border: `1px solid ${row.snapshot_is_stale ? 'rgba(192,120,24,0.45)' : 'var(--ink-10)'}`,
                  borderRadius: 12,
                  padding: '20px 22px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 20,
                        color: 'var(--ink)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {row.brand_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                      Brand #{row.brand_id}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'right' }}>
                    Submitted {formatWhen(row.submitted_at)}
                    {row.submitted_by_portal_user_id ? (
                      <div style={{ marginTop: 2, fontSize: 11, color: 'var(--ink-30)' }}>
                        by {row.submitted_by_portal_user_id.slice(0, 8)}…
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--ink)',
                    fontWeight: 500,
                    marginBottom: 12,
                    lineHeight: 1.45,
                  }}
                >
                  {changeSummary(row)}
                </div>

                {row.snapshot_is_stale ? (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'var(--amber-pale, rgba(192,120,24,0.12))',
                      border: '1px solid rgba(192,120,24,0.25)',
                      fontSize: 13,
                      color: 'var(--amber, #a66a14)',
                      lineHeight: 1.5,
                    }}
                  >
                    ⚠ The brand’s parent has changed since this was submitted (was{' '}
                    {row.current_display_name?.trim() || 'None'}, now {liveLabel}). Re-verify before
                    accepting.
                  </div>
                ) : null}

                {row.user_notes?.trim() ? (
                  <div style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 8, lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>Notes: </span>
                    {row.user_notes.trim()}
                  </div>
                ) : null}

                {row.evidence_url?.trim() ? (
                  <div style={{ fontSize: 13, marginBottom: 12 }}>
                    <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>Evidence: </span>
                    {evidenceHref ? (
                      <a
                        href={evidenceHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--sage)' }}
                      >
                        {row.evidence_url.trim()}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--ink-50)' }}>{row.evidence_url.trim()}</span>
                    )}
                  </div>
                ) : null}

                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-30)',
                      marginBottom: 6,
                    }}
                  >
                    Review notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                  </label>
                  <textarea
                    value={notesById[row.correction_id] ?? ''}
                    onChange={(e) =>
                      setNotesById((prev) => ({
                        ...prev,
                        [row.correction_id]: e.target.value.slice(0, 2000),
                      }))
                    }
                    rows={2}
                    placeholder="Internal note for this decision…"
                    disabled={busy}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--ink-10)',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--ink)',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                {confirmingStale ? (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: 'var(--surface-1, #f5f3ee)',
                      border: '1px solid var(--ink-10)',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 10, lineHeight: 1.45 }}>
                      The parent changed since submission — apply this correction anyway?
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void decide(row, 'accept', true)}
                        style={{
                          padding: '8px 14px',
                          background: 'var(--sage)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          opacity: busy ? 0.7 : 1,
                        }}
                      >
                        {busy ? 'Applying…' : 'Yes, apply anyway'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStaleConfirmId(null)}
                        style={{
                          padding: '8px 14px',
                          background: 'transparent',
                          color: 'var(--ink-50)',
                          border: '1px solid var(--ink-10)',
                          borderRadius: 6,
                          fontSize: 13,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={busy || confirmingStale}
                    onClick={() => onAcceptClick(row)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--sage)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: busy || confirmingStale ? 'default' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      opacity: busy || confirmingStale ? 0.55 : 1,
                    }}
                  >
                    {busy ? 'Working…' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void decide(row, 'reject', false)}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      color: 'var(--ink)',
                      border: '1px solid var(--ink-10)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: busy ? 'default' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      opacity: busy ? 0.55 : 1,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
