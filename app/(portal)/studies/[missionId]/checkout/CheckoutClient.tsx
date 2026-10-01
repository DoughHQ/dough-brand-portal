'use client'

import Link from 'next/link'
import { useState } from 'react'
import { isDisplayableImageUrl } from '@/lib/concept/stimuliStorage'
import { CHECKOUT_ASSURANCES, CONCEPT_CORE_INCLUDED } from '@/lib/checkout/included'
import { formatOrderMoney } from '@/lib/checkout/money'
import type { CheckoutThumb, StudyOrderRow } from '@/lib/checkout/payment'
import './checkout.css'

function Thumb({ item }: { item: CheckoutThumb }) {
  const show = isDisplayableImageUrl(item.imageUrl)
  return (
    <figure className="checkout-thumb">
      {show && item.imageUrl ? (
        <img src={item.imageUrl} alt="" />
      ) : (
        <div className="checkout-thumb-fallback" aria-hidden>
          {item.kind === 'design' ? 'Design' : 'Product'}
        </div>
      )}
      <figcaption>{item.name}</figcaption>
    </figure>
  )
}

function paidDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CheckoutClient({
  order,
  designs,
  products,
  email,
}: {
  order: StudyOrderRow
  designs: CheckoutThumb[]
  products: CheckoutThumb[]
  email: string | null
}) {
  const [requested, setRequested] = useState(false)
  const total = formatOrderMoney(order.amount_cents, order.currency)
  const unit = formatOrderMoney(order.unit_price_cents, order.currency)
  const settled = order.status === 'paid' || order.status === 'waived'
  const invoiceEmail = email?.trim() || 'your account email'
  const when = paidDate(order.paid_at)

  return (
    <div className="checkout-page">
      <Link href="/studies" className="checkout-back">
        ← Studies
      </Link>
      <p className="checkout-kicker">Checkout</p>
      <h1 className="checkout-title">{order.title}</h1>
      <p className="checkout-lede">
        {settled
          ? 'This study is live. The receipt is the order that was settled.'
          : 'Nothing goes live until this order is paid. Dough does not review the study.'}
      </p>

      <div className="checkout-grid">
        <div>
          <section className="checkout-panel">
            <h2>What you are buying</h2>
            {designs.length > 0 ? (
              <>
                <p className="checkout-line" style={{ marginTop: 0 }}>
                  Designs
                </p>
                <ul className="checkout-thumbs">
                  {designs.map((item, index) => (
                    <li key={`design-${index}`}>
                      <Thumb item={item} />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {products.length > 0 ? (
              <>
                <p className="checkout-line">Products they face</p>
                <ul className="checkout-thumbs">
                  {products.map((item, index) => (
                    <li key={`product-${index}`}>
                      <Thumb item={item} />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="checkout-line">
              {order.completions.toLocaleString('en-US')} completed responses
            </p>
          </section>

          <section className="checkout-panel">
            <h2>Included</h2>
            <ul className="checkout-included">
              {CONCEPT_CORE_INCLUDED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link
              className="checkout-sample"
              href={`/studies/concept/${order.mission_id}/report?preview=sample`}
            >
              See a sample report
            </Link>
          </section>
        </div>

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
            </ul>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
