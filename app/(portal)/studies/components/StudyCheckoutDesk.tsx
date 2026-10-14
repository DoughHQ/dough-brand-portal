'use client'

import type { StudyOrderRow } from '@/lib/checkout/payment'
import StudyCheckoutPaymentRow from './studyCheckoutDesk/StudyCheckoutPaymentRow'
import StudyCheckoutPriceForm from './studyCheckoutDesk/StudyCheckoutPriceForm'

export default function StudyCheckoutDesk({
  orders,
  brandNames,
  invoiceContactLabels,
  unitPriceCents,
  currency,
}: {
  orders: StudyOrderRow[]
  brandNames: Record<number, string>
  invoiceContactLabels: Record<string, string>
  unitPriceCents: number | null
  currency: string
}) {
  return (
    <section className="checkout-desk">
      <div className="checkout-desk-head">
        <h2>Awaiting payment</h2>
        <p>Record a payment or waive a design partner. The amount has to match the order.</p>
      </div>
      {orders.length === 0 ? (
        <p className="checkout-desk-empty">No concept studies are waiting on payment.</p>
      ) : (
        <ul className="checkout-desk-list">
          {orders.map((order) => (
            <StudyCheckoutPaymentRow
              key={order.mission_id}
              order={order}
              brandName={brandNames[order.brand_id] ?? `Brand ${order.brand_id}`}
              contactLabel={invoiceContactLabels[order.mission_id] ?? 'No email on file'}
            />
          ))}
        </ul>
      )}

      <StudyCheckoutPriceForm unitPriceCents={unitPriceCents} currency={currency} />
    </section>
  )
}
