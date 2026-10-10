'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CHECKOUT_ASSURANCES, CONCEPT_REPORT_CHAPTERS } from '@/lib/checkout/included'
import { formatOrderMoney } from '@/lib/checkout/money'
import type { CheckoutThumb, StudyOrderRow } from '@/lib/checkout/payment'
import { checkoutWindowFacts } from '@/lib/checkout/windowFacts'
import './checkout.css'

function Thumb({ item, size }: { item: CheckoutThumb; size: 'stage' | 'quiet' }) {
  const letter = item.name.trim().charAt(0).toUpperCase() || (item.kind === 'design' ? 'A' : '·')
  return (
    <figure className={size === 'stage' ? 'checkout-pack' : 'checkout-face'}>
      {item.imageUrl ? (
        // Study media can use remote catalog URLs that must not be server-fetched.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" />
      ) : (
        <div className="checkout-pack-fallback" aria-hidden>
          {letter}
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
  fieldingDays,
  expiresAt,
}: {
  order: StudyOrderRow
  designs: CheckoutThumb[]
  products: CheckoutThumb[]
  email: string | null
  fieldingDays: number | null
  expiresAt: string | null
}) {
  const [requested, setRequested] = useState(false)
  const total = formatOrderMoney(order.amount_cents, order.currency)
  const unit = formatOrderMoney(order.unit_price_cents, order.currency)
  const settled = order.status === 'paid' || order.status === 'waived'
  const invoiceEmail = email?.trim() || 'your account email'
  const when = paidDate(order.paid_at)
  const facts = checkoutWindowFacts({
    completions: order.completions,
    fieldingDays,
    expiresAt,
    settled,
  })

  return (
    <div className="checkout-page">
      <Link href="/studies" className="checkout-back">
        ← Studies
      </Link>
      <p className="checkout-kicker">Checkout</p>
      <h1 className="checkout-title">{order.title}</h1>
      <p className="checkout-lede">
        {settled
          ? 'This study is live.'
          : 'A blind read of these packs, from real shoppers.'}
      </p>

      <div className="checkout-grid">
        <div>
          <section className="checkout-panel" aria-label="The study">
            {designs.length > 0 ? (
              <>
                <h2>The packs</h2>
                <ul className="checkout-packs">
                  {designs.map((item, index) => (
                    <li key={`design-${index}`}>
                      <Thumb item={item} size="stage" />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {products.length > 0 ? (
              <>
                <h2 className={designs.length > 0 ? 'checkout-subhead' : undefined}>They face</h2>
                <ul className="checkout-faces">
                  {products.map((item, index) => (
                    <li key={`product-${index}`}>
                      <Thumb item={item} size="quiet" />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <dl className="checkout-facts">
              <div>
                <dt>Responses</dt>
                <dd>{facts.responses}</dd>
              </div>
              <div>
                <dt>Runs</dt>
                <dd>
                  {facts.length}
                  <small>{facts.lengthNote}</small>
                </dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>
                  {facts.end}
                  <small>{facts.endNote}</small>
                </dd>
              </div>
            </dl>
          </section>

          <section className="checkout-panel" aria-labelledby="checkout-report-title">
            <h2 id="checkout-report-title">What you get back</h2>
            <div className="checkout-chapters">
              {CONCEPT_REPORT_CHAPTERS.map((chapter) => (
                <div className="checkout-chapter" key={chapter.title}>
                  <p className="checkout-chapter-title">{chapter.title}</p>
                  <p className="checkout-chapter-body">{chapter.body}</p>
                </div>
              ))}
              <Link
                className="checkout-chapter checkout-chapter-link"
                href={`/studies/concept/${order.mission_id}/report?preview=sample`}
              >
                <p className="checkout-chapter-title">Sample report</p>
                <p className="checkout-chapter-body">See what the team gets back.</p>
              </Link>
            </div>
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
              <li>Invoice to {invoiceEmail}.</li>
              <li>Dough does not review the study.</li>
            </ul>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
