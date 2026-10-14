'use client'

import { useState } from 'react'
import { formatOrderMoney } from '@/lib/checkout/money'
import type { CheckoutThumb, StudyOrderRow } from '@/lib/checkout/payment'
import { checkoutWindowFacts } from '@/lib/checkout/windowFacts'

export type CheckoutClientProps = {
  order: StudyOrderRow
  designs: CheckoutThumb[]
  products: CheckoutThumb[]
  email: string | null
  fieldingDays: number | null
  expiresAt: string | null
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

export function useCheckoutDesk({
  order,
  email,
  fieldingDays,
  expiresAt,
}: CheckoutClientProps) {
  const [requested, setRequested] = useState(false)
  const total = formatOrderMoney(order.amount_cents, order.currency)
  const unit = formatOrderMoney(order.unit_price_cents, order.currency)
  const orderPaidOrWaived = order.status === 'paid' || order.status === 'waived'
  const invoiceEmail = email?.trim() || 'your account email'
  const when = paidDate(order.paid_at)
  const facts = checkoutWindowFacts({
    completions: order.completions,
    fieldingDays,
    expiresAt,
    orderPaidOrWaived,
  })

  return {
    requested,
    setRequested,
    total,
    unit,
    orderPaidOrWaived,
    /** @deprecated Use orderPaidOrWaived. Kept for existing checkout props. */
    settled: orderPaidOrWaived,
    invoiceEmail,
    when,
    facts,
  }
}
