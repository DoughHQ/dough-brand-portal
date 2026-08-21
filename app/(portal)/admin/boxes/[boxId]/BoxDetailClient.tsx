'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition, type CSSProperties } from 'react'
import {
  allowedTransitions,
  transitionBlockReason,
  transitionLabel,
  type OperatorBoxDetail,
} from '@/lib/box/operatorDetail'
import { boxStatusLabel, BOX_STATUS_TONE, type BoxStatus } from '@/lib/box/operator'
import {
  operatorActionsFor,
  fulfillmentActionLabel,
  fulfillmentStateLabel,
  type FulfillmentRow,
  type OperatorFulfillmentAction,
} from '@/lib/box/fulfillment'
import ConfirmDialog from '@/app/(portal)/studies/ConfirmDialog'
import { advanceBoxStatusAction, reloadBoxDetailAction } from './statusActions'
import { listBoxFulfillmentsAction, advanceFulfillmentAction } from './fulfillmentActions'

type Props = {
  initialDetail: OperatorBoxDetail | null
  loadError: string | null
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const NEEDS_CONFIRM: BoxStatus[] = ['open', 'closed', 'archived']

function confirmCopy(
  target: BoxStatus,
  title: string,
  from?: BoxStatus
): {
  title: string
  body: string
  confirmLabel: string
  tone: 'caution' | 'destructive'
} {
  if (target === 'archived') {
    return {
      title: 'Archive this box?',
      body: 'Archiving removes it from active lists. This is terminal.',
      confirmLabel: 'Archive',
      tone: 'destructive',
    }
  }
  if (target === 'open') {
    const reopen = from === 'shipping'
    return {
      title: reopen ? 'Reopen this box for claims?' : 'Open this box for claims?',
      body: reopen
        ? `Reopening “${title}” returns it to the claim window.`
        : `Opening “${title}” starts the claim window. Qualified users will be able to claim a seat.`,
      confirmLabel: reopen ? 'Reopen claims' : 'Open for claims',
      tone: 'caution',
    }
  }
  return {
    title: 'Close this box?',
    body: `Closing stops new claims and ends the study for “${title}”.`,
    confirmLabel: 'Close box',
    tone: 'caution',
  }
}

export default function BoxDetailClient({ initialDetail, loadError }: Props) {
  const [detail, setDetail] = useState<OperatorBoxDetail | null>(initialDetail)
  const [error, setError] = useState<string | null>(loadError)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<{ target: BoxStatus } | null>(null)
  const [reason, setReason] = useState('')

  if (!detail) {
    return (
      <div style={wrap}>
        <Link href="/admin/boxes" style={backLink}>
          ← Boxes
        </Link>
        <p role="alert" style={{ color: 'var(--red)', fontSize: 14 }}>
          {error ?? 'Box not found.'}
        </p>
      </div>
    )
  }

  const box = detail
  const targets = allowedTransitions(box.status)
  const field = box.frozen_field.products ?? []
  const focalId = box.frozen_field.focal_product_id
  const statusTone = BOX_STATUS_TONE[box.status]
  const copy = confirm ? confirmCopy(confirm.target, box.title, box.status) : null

  function runTransition(target: BoxStatus, boxId: string) {
    startTransition(async () => {
      const result = await advanceBoxStatusAction({
        boxId,
        target,
        reason: reason.trim() || undefined,
      })
      setConfirm(null)
      setReason('')
      if (result.ok) {
        setDetail(result.detail)
        setToast(result.message)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  function onTransitionClick(target: BoxStatus) {
    const blocked = transitionBlockReason(box, target)
    if (blocked) {
      setError(blocked)
      return
    }
    setError(null)
    if (NEEDS_CONFIRM.includes(target)) {
      setConfirm({ target })
    } else {
      runTransition(target, box.box_id)
    }
  }

  return (
    <div style={wrap}>
      <Link href="/admin/boxes" style={backLink}>
        ← Boxes
      </Link>

      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 30,
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {box.title}
          </h1>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: 'var(--r-sm)',
              background: statusTone.bg,
              color: statusTone.fg,
            }}
          >
            {boxStatusLabel(box.status)}
          </span>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-50)' }}>
          {box.brand_name || 'Unknown brand'}
          {box.category_name ? ` · ${box.category_name}` : ''}
          {box.blind_sponsor ? ' · blind sponsor' : ''}
        </p>
      </header>

      {toast ? (
        <div role="status" style={toastStyle}>
          {toast}
        </div>
      ) : null}
      {error ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
          {error}
        </p>
      ) : null}

      {targets.length > 0 ? (
        <section style={card}>
          <div style={cardLabel}>Status actions</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {targets.map((t) => {
              const blocked = transitionBlockReason(box, t)
              const destructive = t === 'archived'
              return (
                <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    disabled={pending || blocked != null}
                    onClick={() => onTransitionClick(t)}
                    style={{
                      border: destructive ? '1px solid var(--red)' : 'none',
                      background: blocked
                        ? 'var(--surface-1)'
                        : destructive
                          ? 'var(--white)'
                          : 'var(--sage)',
                      color: blocked
                        ? 'var(--ink-30)'
                        : destructive
                          ? 'var(--red)'
                          : 'var(--white)',
                      borderRadius: 'var(--r-sm)',
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: blocked || pending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {transitionLabel(t, box.status)}
                  </button>
                  {blocked ? (
                    <span style={{ fontSize: 11, color: 'var(--ink-30)', maxWidth: 180 }}>
                      {blocked}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section style={card}>
          <div style={cardLabel}>Status actions</div>
          <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: 0 }}>
            This box is {boxStatusLabel(box.status).toLowerCase()} — no further status
            changes.
          </p>
        </section>
      )}

      <section style={card}>
        <div style={cardLabel}>Seats</div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <Stat label="Available" value={`${box.seats.available} / ${box.physical_units}`} />
          <Stat label="Claimed" value={box.seats.claimed} />
          <Stat label="Active" value={box.seats.active} />
          <Stat label="Completed" value={box.seats.completed} />
          <Stat label="Abandoned" value={box.seats.abandoned} muted />
          {box.seats.delivery_failed > 0 ? (
            <Stat label="Delivery failed" value={box.seats.delivery_failed} muted />
          ) : null}
        </div>
      </section>

      <section style={card}>
        <div style={cardLabel}>
          Box contents · {field.length} product{field.length === 1 ? '' : 's'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {field.map((p) => (
            <div
              key={p.product_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-sm)',
                background: p.product_id === focalId ? 'var(--cream)' : 'var(--white)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                {p.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-50)' }}>{p.brand}</span>
              {p.product_id === focalId ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--sage)',
                    marginLeft: 'auto',
                  }}
                >
                  Hero
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section style={card}>
        <div style={cardLabel}>Details</div>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px 24px',
            margin: 0,
            fontSize: 13,
          }}
        >
          <Meta
            label="Sessions"
            value={
              box.session_count === 2
                ? `2 · ${box.session2_interval_hours ?? '—'}h apart`
                : '1'
            }
          />
          <Meta label="Grace period" value={`${box.abandon_window_days} days`} />
          <Meta label="Closes" value={box.expires_at ? relativeTime(box.expires_at) : '—'} />
          <Meta label="Created" value={relativeTime(box.created_at)} />
          {box.unit_cost_cents != null ? (
            <Meta label="Unit cost" value={`$${(box.unit_cost_cents / 100).toFixed(2)}`} />
          ) : null}
        </dl>
        {box.sourcing_notes ? (
          <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Sourcing: </span>
            {box.sourcing_notes}
          </p>
        ) : null}
      </section>

      <FulfillmentPanel
        boxId={box.box_id}
        onAdvanced={async (message) => {
          setToast(message)
          const res = await reloadBoxDetailAction(box.box_id)
          if (res.ok) setDetail(res.detail)
        }}
      />

      {box.history.length > 0 ? (
        <section style={card}>
          <div style={cardLabel}>Status history</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {box.history.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 13 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-30)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {relativeTime(e.created_at)}
                </span>
                <span style={{ color: 'var(--ink)' }}>
                  {boxStatusLabel(e.from_status)} → <strong>{boxStatusLabel(e.to_status)}</strong>
                  {e.reason ? <span style={{ color: 'var(--ink-50)' }}> · {e.reason}</span> : null}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirm != null}
        title={copy?.title ?? ''}
        body={
          copy ? (
            <div>
              <p style={{ margin: '0 0 12px' }}>{copy.body}</p>
              <input
                className="cb-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional, logged)"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 40,
                  border: '1px solid var(--ink-10)',
                  borderRadius: 'var(--r-sm)',
                  padding: '0 12px',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          ) : null
        }
        confirmLabel={copy?.confirmLabel ?? 'Confirm'}
        tone={copy?.tone ?? 'caution'}
        busy={pending}
        onCancel={() => {
          setConfirm(null)
          setReason('')
        }}
        onConfirm={() => {
          if (confirm) runTransition(confirm.target, box.box_id)
        }}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string
  value: string | number
  muted?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-50)', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: muted ? 'var(--ink-50)' : 'var(--ink)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={{ fontSize: 11, color: 'var(--ink-50)', marginBottom: 3 }}>{label}</dt>
      <dd style={{ margin: 0, color: 'var(--ink)' }}>{value}</dd>
    </div>
  )
}

const wrap: CSSProperties = {
  maxWidth: 820,
  margin: '0 auto',
  padding: '24px 28px 80px',
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink)',
}
const backLink: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-50)',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 16,
}
const card: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: 24,
  marginBottom: 16,
}
const cardLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ink-30)',
  marginBottom: 16,
}
const toastStyle: CSSProperties = {
  marginBottom: 20,
  fontSize: 13,
  color: 'var(--sage-dark)',
  background: 'var(--sage-soft)',
  border: '1px solid rgba(62,107,74,0.2)',
  borderRadius: 'var(--r-md)',
  padding: '12px 16px',
}

function FulfillmentPanel({
  boxId,
  onAdvanced,
}: {
  boxId: string
  onAdvanced: (message: string) => void | Promise<void>
}) {
  const [rows, setRows] = useState<FulfillmentRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [shipFor, setShipFor] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')
  const [carrier, setCarrier] = useState('')
  const [confirm, setConfirm] = useState<{
    fulfillmentId: string
    target: 'delivered' | 'delivery_failed'
  } | null>(null)
  const [failReason, setFailReason] = useState('')

  useEffect(() => {
    startTransition(async () => {
      const res = await listBoxFulfillmentsAction(boxId)
      if (res.ok) {
        setRows(res.rows)
        setLoadError(null)
      } else {
        setLoadError(res.error)
      }
    })
  }, [boxId])

  function run(
    fulfillmentId: string,
    target: OperatorFulfillmentAction,
    extra?: { trackingRef?: string; carrier?: string; reason?: string }
  ) {
    startTransition(async () => {
      const res = await advanceFulfillmentAction({
        boxId,
        fulfillmentId,
        target,
        trackingRef: extra?.trackingRef,
        carrier: extra?.carrier,
        reason: extra?.reason,
      })
      setConfirm(null)
      setFailReason('')
      if (res.ok) {
        setRows(res.rows)
        setActionError(null)
        setShipFor(null)
        setTracking('')
        setCarrier('')
        await onAdvanced(res.message)
      } else {
        setActionError(res.error)
      }
    })
  }

  const copy = confirm
    ? confirm.target === 'delivered'
      ? {
          title: 'Mark this box delivered?',
          body: 'Delivery starts the respondent window and the abandon deadline. The operator can no longer move this seat.',
          confirmLabel: 'Mark delivered',
          tone: 'caution' as const,
        }
      : {
          title: 'Mark delivery failed?',
          body: 'This takes the seat out of the shipping pipeline. You can retry later.',
          confirmLabel: 'Mark failed',
          tone: 'destructive' as const,
        }
    : null

  if (rows === null && loadError) {
    return (
      <section style={card}>
        <div style={cardLabel}>Fulfillment</div>
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>
          {loadError}
        </p>
      </section>
    )
  }

  if (rows === null) {
    return (
      <section style={card}>
        <div style={cardLabel}>Fulfillment</div>
        <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: 0 }}>Loading seats…</p>
      </section>
    )
  }

  return (
    <section style={card}>
      <div style={cardLabel}>
        Fulfillment · {rows.length} seat{rows.length === 1 ? '' : 's'}
      </div>

      {actionError ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
          {actionError}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: 0 }}>
          No one has claimed a box yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => {
            const actions = operatorActionsFor(r.state)
            const shipping = shipFor === r.fulfillment_id
            return (
              <div
                key={r.fulfillment_id}
                style={{
                  border: '1px solid var(--ink-10)',
                  borderRadius: 'var(--r-md)',
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      {r.recipient_name || `User ${r.user_id}`}
                      {r.ship_city ? (
                        <span style={{ fontWeight: 400, color: 'var(--ink-50)' }}>
                          {' · '}
                          {r.ship_city}
                          {r.ship_state ? `, ${r.ship_state}` : ''}
                          {r.ship_postal ? ` ${r.ship_postal}` : ''}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 3 }}>
                      {fulfillmentStateLabel(r.state)}
                      {r.tracking_ref
                        ? ` · ${r.carrier || 'tracking'} ${r.tracking_ref}`
                        : ''}
                      {r.dings_reliability ? ' · reliability ding' : ''}
                    </div>
                  </div>
                  {actions.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                      {actions.map((a) => {
                        const danger = a === 'delivery_failed'
                        if (a === 'shipped') {
                          return (
                            <button
                              key={a}
                              type="button"
                              disabled={pending}
                              onClick={() => setShipFor(shipping ? null : r.fulfillment_id)}
                              style={miniBtn(false)}
                            >
                              {fulfillmentActionLabel(a)}
                            </button>
                          )
                        }
                        if (a === 'delivered' || a === 'delivery_failed') {
                          return (
                            <button
                              key={a}
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                setConfirm({ fulfillmentId: r.fulfillment_id, target: a })
                              }
                              style={miniBtn(danger)}
                            >
                              {fulfillmentActionLabel(a)}
                            </button>
                          )
                        }
                        return (
                          <button
                            key={a}
                            type="button"
                            disabled={pending}
                            onClick={() => run(r.fulfillment_id, a)}
                            style={miniBtn(danger)}
                          >
                            {fulfillmentActionLabel(a)}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--ink-30)', flexShrink: 0 }}>
                      {r.state === 'claim_expired' ? 'Sweep-driven' : 'Respondent-driven'}
                    </span>
                  )}
                </div>

                {shipping ? (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="Tracking # (optional)"
                      style={shipInput}
                    />
                    <input
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="Carrier"
                      style={{ ...shipInput, width: 120 }}
                    />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(r.fulfillment_id, 'shipped', {
                          trackingRef: tracking,
                          carrier,
                        })
                      }
                      style={miniBtn(false)}
                    >
                      Confirm shipped
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShipFor(null)
                        setTracking('')
                        setCarrier('')
                      }}
                      style={{
                        ...miniBtn(false),
                        background: 'var(--white)',
                        color: 'var(--ink-50)',
                        border: '1px solid var(--ink-10)',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirm != null}
        title={copy?.title ?? ''}
        body={
          copy ? (
            <div>
              <p style={{ margin: confirm?.target === 'delivery_failed' ? '0 0 12px' : 0 }}>
                {copy.body}
              </p>
              {confirm?.target === 'delivery_failed' ? (
                <input
                  className="cb-input"
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  placeholder="Reason (optional, logged)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: 40,
                    border: '1px solid var(--ink-10)',
                    borderRadius: 'var(--r-sm)',
                    padding: '0 12px',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              ) : null}
            </div>
          ) : null
        }
        confirmLabel={copy?.confirmLabel ?? 'Confirm'}
        tone={copy?.tone ?? 'caution'}
        busy={pending}
        onCancel={() => {
          setConfirm(null)
          setFailReason('')
        }}
        onConfirm={() => {
          if (!confirm) return
          run(confirm.fulfillmentId, confirm.target, {
            reason: confirm.target === 'delivery_failed' ? failReason : undefined,
          })
        }}
      />
    </section>
  )
}

function miniBtn(danger: boolean): CSSProperties {
  return {
    border: danger ? '1px solid var(--red)' : 'none',
    background: danger ? 'var(--white)' : 'var(--sage)',
    color: danger ? 'var(--red)' : 'var(--white)',
    borderRadius: 'var(--r-sm)',
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }
}

const shipInput: CSSProperties = {
  height: 36,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 10px',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  width: 160,
}
