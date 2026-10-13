import type { Dispatch, SetStateAction } from 'react'
import Link from 'next/link'
import { CHECKOUT_ASSURANCES } from '@/lib/checkout/included'
import type { StudyOrderRow } from '@/lib/checkout/payment'
import { PRODUCT_NAME } from '@/lib/brand'

type Props = {
  order: StudyOrderRow
  requested: boolean
  setRequested: Dispatch<SetStateAction<boolean>>
  unit: string
  total: string
  when: string | null
  invoiceEmail: string
  settled: boolean
}

export default function CheckoutOrderCard({
  order,
  requested,
  setRequested,
  unit,
  total,
  when,
  invoiceEmail,
  settled,
}: Props) {
  return (
    <aside className="checkout-card">
      <p className="checkout-card-kicker">Order</p>
      <p className="checkout-line">
        {order.completions.toLocaleString('en-US')} completed responses × {unit}
      </p>
      <p className="checkout-total">{total}</p>

      {order.status === 'paid' ? (
        <p className="checkout-receipt">
          Paid
          {order.payment_reference ? ` · ${order.payment_reference}` : ''}
          {when ? ` · ${when}` : ''}
        </p>
      ) : null}
      {order.status === 'waived' ? (
        <p className="checkout-receipt">Complimentary</p>
      ) : null}
      {settled ? (
        <>
          <p className="checkout-receipt">Your study is live.</p>
          <Link className="checkout-live" href={`/studies/concept/${order.mission_id}`}>
            Open study
          </Link>
        </>
      ) : null}

      {order.status === 'awaiting_payment' && !requested ? (
        <button type="button" className="checkout-button" onClick={() => setRequested(true)}>
          Request invoice
        </button>
      ) : null}
      {order.status === 'awaiting_payment' && requested ? (
        <p className="checkout-confirm" role="status">
          We&apos;ll email an invoice to {invoiceEmail} within one business day. Your study
          goes live the moment it&apos;s paid.
        </p>
      ) : null}

      {order.status === 'awaiting_payment' ? (
        <ul className="checkout-assurances">
          {CHECKOUT_ASSURANCES.map((line) => (
            <li key={line}>{line}</li>
          ))}
          <li>Invoice to {invoiceEmail}.</li>
          <li>{PRODUCT_NAME} does not review the study.</li>
        </ul>
      ) : null}
    </aside>
  )
}
