'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { dollarsToCents, formatOrderMoney } from '@/lib/checkout/money'
import type { StudyOrderRow } from '@/lib/checkout/payment'
import { checkoutHref } from '@/lib/checkout/status'
import { recordStudyPaymentAction } from '../../checkoutActions'
import { centsToDollars } from './centsToDollars'

type Props = {
  order: StudyOrderRow
  brandName: string
  contactLabel: string
}

export default function StudyCheckoutPaymentRow({ order, brandName, contactLabel }: Props) {
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
