'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { dollarsToCents, formatOrderMoney } from '@/lib/checkout/money'
import type { StudyOrderRow } from '@/lib/checkout/payment'
import { checkoutHref } from '@/lib/checkout/status'
import { recordStudyPaymentAction, setStudyPriceAction } from '../checkoutActions'

function centsToDollars(cents: number): string {
  const whole = Math.trunc(cents / 100)
  const frac = Math.abs(cents % 100)
  return `${whole}.${String(frac).padStart(2, '0')}`
}

function PaymentRow({
  order,
  brandName,
  contactLabel,
}: {
  order: StudyOrderRow
  brandName: string
  contactLabel: string
}) {
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState(centsToDollars(order.amount_cents))
  const [waive, setWaive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const total = formatOrderMoney(order.amount_cents, order.currency)
  const submitted = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  function submit() {
    setError(null)
    startTransition(async () => {
      const typedCents = dollarsToCents(amount)
      if (!waive && (typedCents == null || typedCents !== order.amount_cents)) {
        setError('That amount does not match the order.')
        return
      }
      const result = await recordStudyPaymentAction({
        missionId: order.mission_id,
        reference,
        waived: waive,
        amountCents: waive ? order.amount_cents : typedCents ?? order.amount_cents,
        currency: order.currency,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDone(result.alreadyRecorded ? 'Already recorded.' : waive ? 'Waived.' : 'Payment recorded.')
    })
  }

  return (
    <li className="checkout-desk-row">
      <div>
        <div className="checkout-desk-title">{order.title}</div>
        <div className="checkout-desk-meta">
          {brandName} · {total} · {submitted}
        </div>
        <div className="checkout-desk-meta">{contactLabel}</div>
        <Link href={checkoutHref(order.mission_id)}>Open checkout</Link>
      </div>
      {done ? (
        <p className="checkout-desk-done">{done}</p>
      ) : (
        <form
          className="checkout-desk-form"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label>
            Reference
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              required
              maxLength={200}
              autoComplete="off"
            />
          </label>
          <label>
            Amount
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              disabled={waive}
              required={!waive}
            />
          </label>
          <label className="checkout-desk-waive">
            <input
              type="checkbox"
              checked={waive}
              onChange={(event) => setWaive(event.target.checked)}
            />
            Waive (design partner)
          </label>
          <button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Record payment'}
          </button>
          {error ? <p className="checkout-desk-error">{error}</p> : null}
        </form>
      )}
    </li>
  )
}

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
  const [dollars, setDollars] = useState(
    unitPriceCents != null ? centsToDollars(unitPriceCents) : ''
  )
  const [priceError, setPriceError] = useState<string | null>(null)
  const [priceNote, setPriceNote] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const current =
    unitPriceCents != null ? formatOrderMoney(unitPriceCents, currency || 'usd') : null

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
            <PaymentRow
              key={order.mission_id}
              order={order}
              brandName={brandNames[order.brand_id] ?? `Brand ${order.brand_id}`}
              contactLabel={invoiceContactLabels[order.mission_id] ?? 'No email on file'}
            />
          ))}
        </ul>
      )}

      <form
        className="checkout-desk-price"
        onSubmit={(event) => {
          event.preventDefault()
          setPriceError(null)
          setPriceNote(null)
          startTransition(async () => {
            const result = await setStudyPriceAction({ dollars })
            if (!result.ok) {
              setPriceError(result.error)
              return
            }
            setPriceNote('Saved. This applies to new orders only.')
          })
        }}
      >
        <h3>Pricing</h3>
        <p>
          {current
            ? `${current} per completed response. A change applies to new orders only.`
            : 'No concept price is set.'}
        </p>
        <label>
          New price per completed response
          <input
            value={dollars}
            onChange={(event) => setDollars(event.target.value)}
            inputMode="decimal"
            required
          />
        </label>
        <button type="submit" disabled={pending || unitPriceCents == null}>
          {pending ? 'Saving…' : 'Change price'}
        </button>
        {priceError ? <p className="checkout-desk-error">{priceError}</p> : null}
        {priceNote ? <p className="checkout-desk-done">{priceNote}</p> : null}
      </form>
    </section>
  )
}
