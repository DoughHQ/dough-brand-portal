'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  applicationChip,
  brandDecisionLabel,
  formatProductCount,
  safeLinkedInHref,
  safeWebHref,
  sortApplicationsForQueue,
  type BrandApplication,
  type BrandApplicationsPageCursor,
  type CatalogCandidate,
} from '@/lib/brandApplications'
import {
  decideBrandApplicationAction,
  listBrandWaitlistApplicationsAction,
} from './actions'
import {
  ApproveInviteDialog,
  ConfirmDialog,
  RejectDialog,
  type ApproveSubmit,
} from './ApplicationDecisionDialogs'
import { formatUtcStamp } from '@/lib/portal-ui/format'

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  return formatUtcStamp(iso)
}

function StatusChip({ row }: { row: BrandApplication }) {
  const chip = applicationChip(row)
  const styles =
    chip.tone === 'amber'
      ? {
          background: 'var(--amber-pale, rgba(192,120,24,0.12))',
          color: 'var(--amber, #a66a14)',
          border: '1px solid rgba(192,120,24,0.28)',
        }
      : chip.tone === 'sage'
        ? {
            background: 'var(--sage-soft)',
            color: 'var(--heading)',
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
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 999,
        ...styles,
      }}
    >
      {chip.label}
    </span>
  )
}

function formatProductsShort(n: number): string {
  const count = Math.max(0, Math.trunc(n))
  return count === 1 ? '1 product' : `${count.toLocaleString()} products`
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
            color: 'var(--heading)',
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

type QueueBanner = {
  message: string
  tone: 'error' | 'warn' | 'info' | 'success'
  detail?: string | null
}

const REACH_SERVER =
  'Couldn’t reach the server. Refresh to check whether it went through.'

export default function BrandApplicationsClient({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  initialError,
  impersonating = false,
}: {
  initialRows: BrandApplication[]
  initialHasMore?: boolean
  initialCursor?: BrandApplicationsPageCursor | null
  initialError?: string | null
  /** True when the access token carries any impersonated_brand_id claim. */
  impersonating?: boolean
}) {
  const [rows, setRows] = useState(initialRows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<BrandApplicationsPageCursor | null>(initialCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [banner, setBanner] = useState<QueueBanner | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<
    null | { kind: 'approve' | 'reject' | 'resend' | 'revoke'; row: BrandApplication }
  >(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [candidateOverride, setCandidateOverride] = useState<CatalogCandidate[] | null>(null)

  useEffect(() => {
    if (!banner || banner.tone !== 'success') return
    const t = window.setTimeout(() => setBanner(null), 6000)
    return () => window.clearTimeout(t)
  }, [banner])

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === 'pending').length,
    [rows]
  )

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await listBrandWaitlistApplicationsAction()
      if (!res.ok) {
        setError(res.error ?? 'Couldn’t refresh the queue.')
        return
      }
      setRows(res.rows ?? [])
      setHasMore(Boolean(res.hasMore))
      setCursor(res.nextCursor ?? null)
      setError(null)
    } catch {
      setError(REACH_SERVER)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await listBrandWaitlistApplicationsAction({ cursor })
      if (!res.ok) {
        setError(res.error ?? 'Couldn’t load more.')
        return
      }
      setRows((prev) =>
        sortApplicationsForQueue([
          ...prev,
          ...(res.rows ?? []).filter((r) => !prev.some((p) => p.waitlist_id === r.waitlist_id)),
        ])
      )
      setHasMore(Boolean(res.hasMore))
      setCursor(res.nextCursor ?? null)
    } catch {
      setError(REACH_SERVER)
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore])

  const closeDialog = useCallback(() => {
    if (busyId) return
    setDialog(null)
    setDialogError(null)
    setCandidateOverride(null)
  }, [busyId])

  const runDecision = useCallback(
    async (
      row: BrandApplication,
      input: Parameters<typeof decideBrandApplicationAction>[0]
    ) => {
      setBusyId(row.waitlist_id)
      setDialogError(null)
      setError(null)
      try {
        const res = await decideBrandApplicationAction(input)

        if (res.code === 'possible_duplicate' && res.candidates && res.candidates.length > 0) {
          setCandidateOverride(res.candidates)
          setDialogError(
            res.error ??
              'This may already be in the catalog. Pick the brand to link, or choose Create new brand.'
          )
          return
        }

        if (!res.ok) {
          if (res.closeAndRefresh) {
            setBanner({
              message: res.error ?? 'Couldn’t complete the review. Refresh to see where it stands.',
              tone: res.tone ?? 'info',
            })
            setDialog(null)
            setCandidateOverride(null)
            void refresh()
            return
          }
          setDialogError(res.error ?? 'Couldn’t complete the review. Try again.')
          return
        }

        setDialog(null)
        setCandidateOverride(null)

        if (input.action === 'approve' || input.action === 'resend') {
          if (res.sent === true) {
            setBanner({
              message: `Invite sent to ${res.invited_email ?? row.contact_email}.`,
              tone: 'success',
            })
          } else if (res.sent === false) {
            setBanner({
              message: 'Approved, but the invite email didn’t send. Use Resend.',
              tone: 'warn',
              detail: res.send_error ?? null,
            })
          } else {
            setBanner({
              message: `Invite saved for ${res.invited_email ?? row.contact_email}.`,
              tone: 'success',
            })
          }
        } else if (input.action === 'reject') {
          if (res.sent === true) {
            setBanner({ message: 'Rejected. Reply sent.', tone: 'success' })
          } else if (res.sent === false) {
            setBanner({
              message: 'Rejected, but the reply email didn’t send.',
              tone: 'warn',
            })
          } else {
            setBanner({ message: 'Rejected. No reply sent.', tone: 'success' })
          }
        } else if (res.revoked === 0) {
          setBanner({ message: 'No pending invite to revoke.', tone: 'info' })
        } else {
          setBanner({ message: 'Invite revoked.', tone: 'success' })
        }
        void refresh()
      } catch {
        setBanner({ message: REACH_SERVER, tone: 'error' })
      } finally {
        setBusyId(null)
      }
    },
    [refresh]
  )

  const submitApprove = useCallback(
    (row: BrandApplication, input: ApproveSubmit) => {
      void runDecision(row, {
        action: 'approve',
        waitlistId: row.waitlist_id,
        brandName: input.brandName,
        existingBrandId: input.existingBrandId,
        confirmNew: input.confirmNew,
        reviewNotes: input.reviewNotes,
      })
    },
    [runDecision]
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
          Requests to join Runoff. Pending first. <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Approve &amp; invite</strong>{' '}
          creates the brand if it&apos;s new and emails a 7-day invite.{' '}
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Reject</strong> sends a short reply
          unless you untick it.
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

      {impersonating ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--amber-pale, rgba(192,120,24,0.12))',
            color: 'var(--amber, #a66a14)',
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          Leave the brand workspace (stop impersonating) before reviewing applications.
        </div>
      ) : null}

      {banner ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            ...(banner.tone === 'success'
              ? {
                  background: 'var(--sage-soft, rgba(74, 103, 65, 0.12))',
                  color: 'var(--heading)',
                }
              : banner.tone === 'warn'
                ? {
                    background: 'var(--amber-pale, rgba(192,120,24,0.12))',
                    color: 'var(--amber, #a66a14)',
                  }
                : banner.tone === 'info'
                  ? {
                      background: 'var(--surface-1)',
                      color: 'var(--ink)',
                      border: '1px solid var(--ink-10)',
                    }
                  : {
                      background: 'rgba(180, 35, 24, 0.08)',
                      color: 'var(--red, #b42318)',
                    }),
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div>{banner.message}</div>
            {banner.detail ? (
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{banner.detail}</div>
            ) : null}
          </div>
          {banner.tone !== 'success' ? (
            <button
              type="button"
              onClick={() => setBanner(null)}
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: 'inherit',
                fontFamily: 'var(--font-sans)',
                padding: 0,
                opacity: 0.75,
              }}
            >
              Dismiss
            </button>
          ) : null}
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
            background: 'var(--paper)',
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
            const websiteHref = safeWebHref(row.brand_website)
            const pending = row.status === 'pending'
            const busy = busyId === row.waitlist_id
            const brandLabel = brandDecisionLabel(row)
            const productCount = formatProductCount(row)
            const warningBorder =
              row.already_claimed ||
              row.flagged_not_mine_count > 0 ||
              row.domain_match === false ||
              row.free_email

            return (
              <article
                key={row.waitlist_id}
                style={{
                  background: 'var(--paper)',
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
                        href={`mailto:${encodeURIComponent(row.contact_email)}`}
                        style={{ color: 'var(--sage)', fontWeight: 500 }}
                      >
                        {row.contact_email}
                      </a>
                      {row.role_title ? (
                        <span style={{ color: 'var(--ink-30)' }}> · {row.role_title}</span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {row.domain_match === true ? (
                        <DecisionBadge tone="sage">Email matches website</DecisionBadge>
                      ) : row.domain_match === false ? (
                        <DecisionBadge tone="amber">Email domain ≠ website</DecisionBadge>
                      ) : (
                        <DecisionBadge tone="ink">No website</DecisionBadge>
                      )}
                      {row.free_email ? (
                        <DecisionBadge tone="amber">Personal email</DecisionBadge>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <StatusChip row={row} />
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 6 }}>
                      Applied {formatWhen(row.created_at)}
                    </div>
                    {!pending && row.reviewed_at ? (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                        Reviewed {formatWhen(row.reviewed_at)}
                      </div>
                    ) : null}
                    {pending && row.alert_sent_at ? (
                      <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>
                        Alert sent {formatWhen(row.alert_sent_at)}
                      </div>
                    ) : null}
                    {pending && !row.alert_sent_at && row.alert_last_error ? (
                      <div style={{ fontSize: 12, color: 'var(--amber, #a66a14)', marginTop: 2 }}>
                        Alert failing ({row.alert_attempts}/5)
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
                  {netNew
                    ? row.catalog_candidates.map((c) => (
                        <DecisionBadge key={c.brand_id} tone="ink">
                          Possible catalog match: {c.brand_name} ({formatProductsShort(c.product_count)})
                        </DecisionBadge>
                      ))
                    : null}
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
                      color: 'var(--heading)',
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
                  <MetaLine label="Website">
                    {websiteHref ? (
                      <a
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--sage)' }}
                      >
                        {row.brand_website}
                      </a>
                    ) : row.brand_website ? (
                      <span style={{ color: 'var(--ink-50)' }}>{row.brand_website}</span>
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

                {!impersonating && pending ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDialogError(null)
                        setCandidateOverride(null)
                        setDialog({ kind: 'approve', row })
                      }}
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
                      Approve &amp; invite
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDialogError(null)
                        setDialog({ kind: 'reject', row })
                      }}
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
                ) : null}

                {!impersonating &&
                row.status === 'invited' &&
                (row.invitation?.status === 'pending' ||
                  row.invitation?.status === 'expired') ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDialogError(null)
                        setDialog({ kind: 'resend', row })
                      }}
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
                      Resend invite
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDialogError(null)
                        setDialog({ kind: 'revoke', row })
                      }}
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
                      Revoke
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}

      {hasMore ? (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      {dialog?.kind === 'approve' ? (
        <ApproveInviteDialog
          row={dialog.row}
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          candidateOverride={candidateOverride}
          onClose={closeDialog}
          onSubmit={(input) => submitApprove(dialog.row, input)}
        />
      ) : null}
      {dialog?.kind === 'reject' ? (
        <RejectDialog
          row={dialog.row}
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          onClose={closeDialog}
          onSubmit={(input) =>
            void runDecision(dialog.row, {
              action: 'reject',
              waitlistId: dialog.row.waitlist_id,
              reviewNotes: input.reviewNotes,
              sendEmail: input.sendEmail,
            })
          }
        />
      ) : null}
      {dialog?.kind === 'resend' ? (
        <ConfirmDialog
          title="Resend invite"
          body={`Send a new link to ${dialog.row.contact_email}? The old link stops working.`}
          primaryLabel="Resend invite"
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() =>
            void runDecision(dialog.row, {
              action: 'resend',
              waitlistId: dialog.row.waitlist_id,
            })
          }
        />
      ) : null}
      {dialog?.kind === 'revoke' ? (
        <ConfirmDialog
          title="Revoke invite"
          body={`Revoke the invite for ${dialog.row.contact_email}? The link stops working.`}
          primaryLabel="Revoke"
          busy={busyId === dialog.row.waitlist_id}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() =>
            void runDecision(dialog.row, {
              action: 'revoke',
              waitlistId: dialog.row.waitlist_id,
            })
          }
        />
      ) : null}
    </div>
  )
}
