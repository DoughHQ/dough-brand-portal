'use client'

import { card, cardLabel } from './panel/panelStyles'
import { FulfillmentConfirm } from './panel/FulfillmentConfirm'
import { PanelHeader } from './panel/PanelHeader'
import { SeatCard } from './panel/SeatCard'
import { useBrandFulfillment } from './panel/useBrandFulfillment'

type Props = {
  boxId: string
}

export default function BrandFulfillmentPanel({ boxId }: Props) {
  const {
    rows,
    holds,
    addressChanges,
    loadError,
    actionError,
    toast,
    pending,
    shipFor,
    setShipFor,
    tracking,
    setTracking,
    carrier,
    setCarrier,
    confirm,
    setConfirm,
    failReason,
    setFailReason,
    run,
    copy,
  } = useBrandFulfillment(boxId)

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
      <PanelHeader boxId={boxId} rows={rows} pending={pending} />

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
          {rows.map((r) => (
            <SeatCard
              key={r.fulfillment_id}
              r={r}
              holds={holds}
              addressChanges={addressChanges}
              shipFor={shipFor}
              setShipFor={setShipFor}
              tracking={tracking}
              setTracking={setTracking}
              carrier={carrier}
              setCarrier={setCarrier}
              pending={pending}
              setConfirm={setConfirm}
              run={run}
            />
          ))}
        </div>
      )}

      <FulfillmentConfirm
        confirm={confirm}
        setConfirm={setConfirm}
        copy={copy}
        failReason={failReason}
        setFailReason={setFailReason}
        pending={pending}
        run={run}
      />
    </section>
  )
}
