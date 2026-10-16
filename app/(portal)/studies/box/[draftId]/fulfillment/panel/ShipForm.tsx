import type { BrandFulfillmentRow } from '@/lib/box/brandFulfillment'
import { miniBtn, shipInput } from './panelStyles'
import type { BrandFulfillmentState } from './useBrandFulfillment'

export function ShipForm({
  r,
  tracking,
  setTracking,
  carrier,
  setCarrier,
  pending,
  setShipFor,
  run,
}: { r: BrandFulfillmentRow } & Pick<
  BrandFulfillmentState,
  'tracking' | 'setTracking' | 'carrier' | 'setCarrier' | 'pending' | 'setShipFor' | 'run'
>) {
  return (
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
  )
}
