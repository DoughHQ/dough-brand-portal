'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { formatOrderMoney } from '@/lib/checkout/money'
import type { StudyOrderRow, StudyRefundMethod } from '@/lib/checkout/payment'
import { checkoutHref } from '@/lib/checkout/status'
import { recordStudyRefundAction } from '../checkoutActions'

function RefundRow({
  order,
  brandName,
}: {
  order: StudyOrderRow
  brandName: string
}) {
  const [reference, setReference] = useState('')
  const [method, setMethod] = useState<StudyRefundMethod>('refund')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const owed =
    order.refund_due_cents != null
      ? formatOrderMoney(order.refund_due_cents, order.currency)
      : null
  const settled = order.settled_at
    ? new Date(order.settled_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await recordStudyRefundAction({
        missionId: order.mission_id,
        reference,
        method,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDone(result.alreadyRecorded ? 'Already recorded.' : 'Refund recorded.')
    })
  }

  return (
    <li className="checkout-desk-row">
      <div>
        <div className="checkout-desk-title">{order.title}</div>
        <div className="checkout-desk-meta">
          {brandName}
          {owed ? ` · ${owed} owed` : ''}
          {settled ? ` · settled ${settled}` : ''}
          {order.delivered_completions != null
            ? ` · ${order.delivered_completions} delivered`
            : ''}
        </div>
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
            Method
            <select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value === 'credit' ? 'credit' : 'refund')
              }
            >
              <option value="refund">Refund (money back)</option>
              <option value="credit">Credit (next study)</option>
            </select>
          </label>
          <button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Record refund'}
          </button>
          {error ? <p className="checkout-desk-error">{error}</p> : null}
        </form>
      )}
    </li>
  )
}

export default function StudyRefundsOwed({
  orders,
  brandNames,
}: {
  orders: StudyOrderRow[]
  brandNames: Record<number, string>
}) {
  return (
    <section className="checkout-desk">
      <div className="checkout-desk-head">
        <h2>Refunds owed</h2>
        <p>
          Settled studies with money still owed. Record a Stripe refund or a credit toward
          the next study.
        </p>
      </div>
      {orders.length === 0 ? (
        <p className="checkout-desk-empty">No refunds are waiting.</p>
      ) : (
        <ul className="checkout-desk-list">
          {orders.map((order) => (
            <RefundRow
              key={order.mission_id}
              order={order}
              brandName={brandNames[order.brand_id] ?? `Brand ${order.brand_id}`}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
