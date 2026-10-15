'use client'

import { useEffect, useState, useTransition, type CSSProperties } from 'react'
import ConfirmDialog from '@/app/(portal)/studies/ConfirmDialog'
import {
  brandActionsFor,
  brandAddressChangeCopy,
  brandFulfillmentsToCsv,
  formatLabelAddress,
  fulfillmentActionLabel,
  fulfillmentHasAddress,
  fulfillmentSeatStatus,
  fulfillmentWaitingCopy,
  shipHoldCopy,
  type AddressChanges,
  type BrandFulfillmentAction,
  type BrandFulfillmentRow,
  type ShipHolds,
} from '@/lib/box/brandFulfillment'
import {
  advanceBrandFulfillmentAction,
  listBrandBoxFulfillmentsAction,
} from './actions'

type Props = {
  boxId: string
}

const card: CSSProperties = {
  background: 'var(--paper)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: '20px 22px',
}

const cardLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-50)',
  marginBottom: 14,
}

function miniBtn(danger: boolean): CSSProperties {
  return {
    border: danger ? '1px solid var(--red)' : 'none',
    background: danger ? 'var(--paper)' : 'var(--sage)',
    color: danger ? 'var(--red)' : 'var(--on-fill)',
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

function downloadCsv(rows: BrandFulfillmentRow[], boxId: string) {
  const csv = brandFulfillmentsToCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `packing-labels-${boxId.slice(0, 8)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function BrandFulfillmentPanel({ boxId }: Props) {
  const [rows, setRows] = useState<BrandFulfillmentRow[] | null>(null)
  const [holds, setHolds] = useState<ShipHolds>({})
  const [addressChanges, setAddressChanges] = useState<AddressChanges>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
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
      const res = await listBrandBoxFulfillmentsAction(boxId)
      if (res.ok) {
        setRows(res.rows)
        setHolds(res.holds)
        setAddressChanges(res.addressChanges)
        setLoadError(null)
      } else {
        setLoadError(res.error)
      }
    })
  }, [boxId])

  function run(
    fulfillmentId: string,
    target: BrandFulfillmentAction,
    extra?: { trackingRef?: string; carrier?: string; reason?: string }
  ) {
    startTransition(async () => {
      const res = await advanceBrandFulfillmentAction({
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
        setHolds(res.holds)
        setAddressChanges(res.addressChanges)
        setActionError(null)
        setShipFor(null)
        setTracking('')
        setCarrier('')
        setToast(res.message)
      } else {
        setActionError(res.error)
        if (res.rows && res.holds) {
          setRows(res.rows)
          setHolds(res.holds)
          if (res.addressChanges) setAddressChanges(res.addressChanges)
          setShipFor(null)
        }
      }
    })
  }

  const copy = confirm
    ? confirm.target === 'delivered'
      ? {
          title: 'Mark this box delivered?',
          body: 'Delivery starts the respondent window. You can no longer move this seat after this.',
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
        <div style={cardLabel}>Packing</div>
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>
          {loadError}
        </p>
      </section>
    )
  }

  if (rows === null) {
    return (
      <section style={card}>
        <div style={cardLabel}>Packing</div>
        <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: 0 }}>Loading seats…</p>
      </section>
    )
  }

  return (
    <section style={card}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 4,
        }}
      >
        <div style={{ ...cardLabel, marginBottom: 0 }}>
          Packing · {rows.length} seat{rows.length === 1 ? '' : 's'}
        </div>
        {rows.length > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => downloadCsv(rows, boxId)}
            style={{
              ...miniBtn(false),
              background: 'var(--paper)',
              color: 'var(--ink)',
              border: '1px solid var(--ink-10)',
            }}
          >
            Download CSV
          </button>
        ) : null}
      </div>

      {toast ? (
        <p role="status" style={{ fontSize: 13, color: 'var(--heading)', margin: '10px 0 0' }}>
          {toast}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginTop: 10 }}>
          {actionError}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '14px 0 0' }}>
          No one has claimed a box yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {rows.map((r) => {
            const hold = holds[r.fulfillment_id] ?? null
            const addrChange = addressChanges[r.fulfillment_id] ?? null
            const readiness = {
              consentedAt: r.consented_at,
              hasAddress: fulfillmentHasAddress(r),
              shipHold: hold,
            }
            const actions = brandActionsFor(r.state, readiness)
            const waiting = fulfillmentWaitingCopy(r.state, readiness)
            const shipping = shipFor === r.fulfillment_id && !hold
            const label = formatLabelAddress(r)
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
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      {r.recipient_name || 'Recipient pending'}
                    </div>
                    {label ? (
                      <pre
                        style={{
                          margin: '6px 0 0',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 12,
                          lineHeight: 1.45,
                          color: 'var(--ink-50)',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {label}
                      </pre>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 4 }}>
                        No address on file yet
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 6 }}>
                      {fulfillmentSeatStatus(r)}
                    </div>
                    {hold ? (
                      <div
                        role="status"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--red)',
                          marginTop: 3,
                        }}
                      >
                        {shipHoldCopy(hold)}
                      </div>
                    ) : null}
                    {addrChange ? (
                      <div
                        role="status"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--amber, #A16514)',
                          marginTop: 3,
                        }}
                      >
                        {brandAddressChangeCopy(addrChange)}
                      </div>
                    ) : null}
                  </div>
                  {actions.length > 0 || waiting ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexShrink: 0,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      {waiting ? (
                        <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{waiting}</span>
                      ) : null}
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
                  ) : hold ? null : r.left_at ? (
                    <span style={{ fontSize: 11, color: 'var(--ink-30)', flexShrink: 0 }}>
                      Left by respondent
                    </span>
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
                        background: 'var(--paper)',
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
