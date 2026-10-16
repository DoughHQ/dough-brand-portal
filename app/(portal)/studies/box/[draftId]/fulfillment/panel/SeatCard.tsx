import {
  brandActionsFor,
  brandAddressChangeCopy,
  formatLabelAddress,
  fulfillmentHasAddress,
  fulfillmentSeatStatus,
  fulfillmentWaitingCopy,
  shipHoldCopy,
  type BrandFulfillmentRow,
} from '@/lib/box/brandFulfillment'
import { SeatActions } from './SeatActions'
import { ShipForm } from './ShipForm'
import type { BrandFulfillmentState } from './useBrandFulfillment'

type Props = { r: BrandFulfillmentRow } & Pick<
  BrandFulfillmentState,
  | 'holds'
  | 'addressChanges'
  | 'shipFor'
  | 'setShipFor'
  | 'tracking'
  | 'setTracking'
  | 'carrier'
  | 'setCarrier'
  | 'pending'
  | 'setConfirm'
  | 'run'
>

export function SeatCard({
  r,
  holds,
  addressChanges,
  shipFor,
  setShipFor,
  tracking,
  setTracking,
  carrier,
  setCarrier,
  pending,
  setConfirm,
  run,
}: Props) {
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
        <SeatActions
          r={r}
          actions={actions}
          waiting={waiting}
          hold={hold}
          shipping={shipping}
          pending={pending}
          setShipFor={setShipFor}
          setConfirm={setConfirm}
          run={run}
        />
      </div>

      {shipping ? (
        <ShipForm
          r={r}
          tracking={tracking}
          setTracking={setTracking}
          carrier={carrier}
          setCarrier={setCarrier}
          pending={pending}
          setShipFor={setShipFor}
          run={run}
        />
      ) : null}
    </div>
  )
}
