'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  brandDecisionLabel,
  formatProductCount,
  safeLinkedInHref,
  sortApplicationsForQueue,
  type BrandApplication,
  type ApplicationStatus,
} from '@/lib/brandApplications'
import {
  listBrandWaitlistApplicationsAction,
  setBrandApplicationStatusAction,
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

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  invited: 'Invited',
  approved: 'Approved',
  rejected: 'Rejected',
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const pending = status === 'pending'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 999,
        background: pending ? 'var(--sage-soft)' : 'var(--surface-1)',
        color: pending ? 'var(--sage-dark)' : 'var(--ink-50)',
        border: `1px solid ${pending ? 'rgba(62,107,74,0.22)' : 'var(--ink-10)'}`,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function DecisionBadge({
  tone,
  children,
}: {
  tone: 'sage' | 'amber' | 'ink'
  children: ReactNode
}) {
  const styles =
    tone === 'amber'
      ? {
          background: 'var(--amber-pale, rgba(192,120,24,0.12))',
          color: 'var(--amber, #a66a14)',
          border: '1px solid rgba(192,120,24,0.28)',
        }
      : tone === 'sage'
        ? {
            background: 'var(--sage-soft)',
            color: 'var(--sage-dark)',
            border: '1px solid rgba(62,107,74,0.22)',
          }
        : {
            background: 'var(--surface-1)',
            color: 'var(--ink-50)',
            border: '1px solid var(--ink-10)',
          }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: '4px 9px',
        borderRadius: 999,
        ...styles,
      }}
    >
      {children}
    </span>
  )
}

function MetaLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
      <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>{label} </span>
      {children}
    </div>
  )
}

export default function BrandApplicationsClient({
  initialRows,
  initialError,
}: {
  initialRows: BrandApplication[]
  initialError?: string | null
}) {
  const [rows, setRows] = useState(initialRows)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [flash, setFlash] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notesById, setNotesById] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 5000)
    return () => window.clearTimeout(t)
  }, [flash])

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === 'pending').length,
    [rows]
  )

  const refresh = useCallback(async () => {
    setRefreshing(true)
    const res = await listBrandWaitlistApplicationsAction()
    setRefreshing(false)
    if (!res.ok) {
      setError(res.error ?? 'Couldn’t refresh the queue.')
      return
    }
    setRows(res.rows ?? [])
    setError(null)
  }, [])

  const patchRow = useCallback(
    (
      waitlistId: string,
      patch: Partial<Pick<BrandApplication, 'status' | 'reviewed_at' | 'review_notes'>>
    ) => {
      setRows((prev) =>
        sortApplicationsForQueue(
          prev.map((r) => (r.waitlist_id === waitlistId ? { ...r, ...patch } : r))
        )
      )
      setNotesById((prev) => {
        const next = { ...prev }
        delete next[waitlistId]
        return next
      })
    },
    []
  )

  const decide = useCallback(
    async (row: BrandApplication, decision: 'approve' | 'reject') => {
      setBusyId(row.waitlist_id)
      setError(null)
      const reviewNotes = notesById[row.waitlist_id] ?? null
      const res = await setBrandApplicationStatusAction({
        waitlistId: row.waitlist_id,
        decision,
        reviewNotes,
      })
      setBusyId(null)

      if (!res.ok || !res.result) {
        if (res.code === 'not_found') {
          setFlash(res.error ?? 'Removed from queue.')
          void refresh()
          return
        }
        setError(res.error ?? 'Couldn’t complete the review. Try again.')
        return
      }

      const result = res.result
      const notesTrimmed = reviewNotes?.trim().slice(0, 2000) || null

      if (result.idempotent_noop) {
        patchRow(row.waitlist_id, {
          status: result.status,
          reviewed_at: row.reviewed_at ?? new Date().toISOString(),
          review_notes: row.review_notes ?? notesTrimmed,
        })
        setFlash('Already decided — showing the recorded status.')
        void refresh()
        return
      }

      patchRow(row.waitlist_id, {
        status: result.status,
        reviewed_at: new Date().toISOString(),
        review_notes: notesTrimmed,
      })

      if (decision === 'approve') {
        const accessNote =
          result.note?.trim() ||
          (result.grants_access
            ? null
            : 'Portal access is not granted yet — this only records the application decision.')
        setFlash(
          accessNote
            ? `Marked approved. ${accessNote}`
            : 'Marked approved.'
        )
      } else {
        setFlash('Application rejected.')
      }
    },
    [notesById, patchRow, refresh]
  )

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
          Brand applications
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, maxWidth: 640, margin: 0 }}>
          Pre-call queue from the invite-only signup. Pending applications sit at the top.
          Approving records a decision only — it does not create a portal login or send credentials.
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/admin/ownership-corrections"
            style={{ fontSize: 12, color: 'var(--sage)', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Ownership corrections
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            style={{
              fontSize: 12,
              color: 'var(--ink-50)',
              background: 'none',
              border: 'none',
              cursor: refreshing ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {rows.length > 0 ? (
            <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
              {pendingCount} pending · {rows.length} total
            </span>
          ) : null}
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
            lineHeight: 1.45,
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
            No applications yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((row) => {
            const netNew = row.selected_brand_id == null
            const linkedInHref = safeLinkedInHref(row.linkedin_url)
            const pending = row.status === 'pending'
            const busy = busyId === row.waitlist_id
            const brandLabel = brandDecisionLabel(row)
            const productCount = formatProductCount(row)
            const warningBorder = row.already_claimed || row.flagged_not_mine_count > 0

            return (
              <article
                key={row.waitlist_id}
                style={{
                  background: 'var(--white)',
                  border: `1px solid ${
                    row.already_claimed
                      ? 'rgba(192,120,24,0.45)'
                      : warningBorder
                        ? 'rgba(192,120,24,0.28)'
                        : 'var(--ink-10)'
                  }`,
                  borderRadius: 12,
                  padding: '20px 22px',
                  opacity: pending ? 1 : 0.78,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 20,
                        color: 'var(--ink)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {row.contact_name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 3 }}>
                      <a
                        href={`mailto:${row.contact_email}`}
                        style={{ color: 'var(--sage)', fontWeight: 500 }}
                      >
                        {row.contact_email}
                      </a>
                      {row.role_title ? (
                        <span style={{ color: 'var(--ink-30)' }}> · {row.role_title}</span>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <StatusPill status={row.status} />
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 6 }}>
                      Applied {formatWhen(row.created_at)}
                    </div>
                    {!pending && row.reviewed_at ? (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                        Reviewed {formatWhen(row.reviewed_at)}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  {netNew ? <DecisionBadge tone="sage">Net-new brand</DecisionBadge> : null}
                  {row.already_claimed ? (
                    <DecisionBadge tone="amber">Already claimed</DecisionBadge>
                  ) : null}
                  {row.flagged_not_mine_count > 0 ? (
                    <DecisionBadge tone="amber">
                      Flagged {row.flagged_not_mine_count} product
                      {row.flagged_not_mine_count === 1 ? '' : 's'} as not theirs
                    </DecisionBadge>
                  ) : null}
                </div>

                {row.already_claimed ? (
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
                    A colleague already has portal access for this brand. Treat this as a
                    second-employee request, not a first claim.
                  </div>
                ) : null}

                {netNew ? (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'var(--sage-soft)',
                      border: '1px solid rgba(62,107,74,0.18)',
                      fontSize: 13,
                      color: 'var(--sage-dark)',
                      lineHeight: 1.5,
                    }}
                  >
                    They didn’t match an existing brand. Confirm the name on the call before
                    minting anything.
                  </div>
                ) : null}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                    gap: '8px 24px',
                    marginBottom: 16,
                  }}
                >
                  <MetaLine label="Brand">
                    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{brandLabel}</span>
                    {row.selected_brand_id != null ? (
                      <span style={{ color: 'var(--ink-30)' }}> · #{row.selected_brand_id}</span>
                    ) : null}
                    {row.selected_brand_name &&
                    row.brand_name_typed &&
                    row.selected_brand_name !== row.brand_name_typed ? (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                        Typed as “{row.brand_name_typed}”
                      </div>
                    ) : null}
                  </MetaLine>
                  <MetaLine label="Products on Dough">
                    <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                      {productCount}
                    </span>
                  </MetaLine>
                  <MetaLine label="LinkedIn">
                    {linkedInHref ? (
                      <a
                        href={linkedInHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--sage)' }}
                      >
                        {row.linkedin_url}
                      </a>
                    ) : row.linkedin_url ? (
                      <span style={{ color: 'var(--ink-50)' }}>{row.linkedin_url}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </MetaLine>
                  <MetaLine label="Call booked">
                    {row.booking_scheduled_at ? (
                      <span style={{ color: 'var(--ink)' }}>{formatWhen(row.booking_scheduled_at)}</span>
                    ) : (
                      <span>Not booked</span>
                    )}
                  </MetaLine>
                </div>

                {!pending && row.review_notes ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--ink-50)',
                      marginBottom: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>Review notes: </span>
                    {row.review_notes}
                  </div>
                ) : null}

                {pending ? (
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
                      Review notes{' '}
                      <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                    </label>
                    <textarea
                      value={notesById[row.waitlist_id] ?? ''}
                      onChange={(e) =>
                        setNotesById((prev) => ({
                          ...prev,
                          [row.waitlist_id]: e.target.value.slice(0, 2000),
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
                ) : null}

                {pending ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(row, 'approve')}
                      title="Records approval only — does not create portal access"
                      style={{
                        padding: '8px 14px',
                        background: 'var(--sage)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: busy ? 'default' : 'pointer',
                        fontFamily: 'var(--font-sans)',
                        opacity: busy ? 0.55 : 1,
                      }}
                    >
                      {busy ? 'Working…' : 'Approve application'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decide(row, 'reject')}
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
                    <span style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.4, maxWidth: 360 }}>
                      Does not create an account or send invite credentials.
                    </span>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
