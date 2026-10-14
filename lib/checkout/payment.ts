import type { StudyOrderStatus } from './status'
import { PRODUCT_NAME } from '@/lib/brand'

export type StudyRefundMethod = 'refund' | 'credit'

export type StudyOrderRow = {
  mission_id: string
  brand_id: number
  title: string
  completions: number
  unit_price_cents: number
  amount_cents: number
  currency: string
  status: StudyOrderStatus
  payment_reference: string | null
  paid_at: string | null
  created_at: string
  /** When the report settled the order (post-report). Null while unpaid or still collecting. */
  settled_at: string | null
  delivered_completions: number | null
  refund_due_cents: number | null
  refund_method: StudyRefundMethod | null
  refund_reference: string | null
  refunded_cents: number | null
  refunded_at: string | null
}

export type CheckoutThumb = {
  name: string
  imageUrl: string | null
  kind: 'design' | 'product'
}

export function isOrderSettled(order: Pick<StudyOrderRow, 'settled_at'>): boolean {
  return order.settled_at != null
}

export function recordPaymentArgs(input: {
  missionId: string
  reference: string
  waived: boolean
  amountCents: number
  currency: string
}): {
  p_mission_id: string
  p_payment_reference: string
  p_waived: boolean
  p_amount_cents?: number
  p_currency?: string
} {
  const base = {
    p_mission_id: input.missionId,
    p_payment_reference: input.reference.trim(),
    p_waived: input.waived,
  }
  if (input.waived) return base
  return {
    ...base,
    p_amount_cents: input.amountCents,
    p_currency: input.currency,
  }
}

export function recordRefundArgs(input: {
  missionId: string
  reference: string
  method: StudyRefundMethod
}): {
  p_mission_id: string
  p_reference: string
  p_method: StudyRefundMethod
} {
  return {
    p_mission_id: input.missionId,
    p_reference: input.reference.trim(),
    p_method: input.method,
  }
}

const HINT_COPY: Record<string, string> = {
  NOT_DOUGH_ADMIN: `Only ${PRODUCT_NAME} staff can do this.`,
  PAYMENT_REFERENCE_REQUIRED:
    'Add a reference: an invoice number, a payment id, or why it was waived.',
  REFUND_REFERENCE_REQUIRED:
    'Add a reference: a Stripe refund id, an invoice number, or a credit-note number.',
  INVALID_REFUND_METHOD: 'Choose refund (money back) or credit (toward the next study).',
  NOT_SETTLED: "This study isn't settled yet. The refund is worked out when its report is final.",
  ALREADY_REFUNDED: 'A refund is already recorded for this study.',
  NOTHING_DUE: 'This study owes no refund.',
  ORDER_NOT_FOUND: 'This study has no order.',
  NOT_AWAITING_PAYMENT: 'This order is already paid or waived.',
  AMOUNT_REQUIRED: 'Enter the amount paid. It has to match the order.',
  AMOUNT_MISMATCH: 'That amount does not match the order.',
  MISSION_NOT_FOUND: 'That study is no longer there.',
  MISSION_EXPIRED: 'This study expired before it was paid.',
  FIELDING_WINDOW_TOO_SHORT: 'A study needs at least 7 days to run.',
  PRICE_OUT_OF_RANGE: 'A price per response must be between $1 and $10,000.',
  UNKNOWN_TEST_TYPE: 'That study type has no price.',
}

export function checkoutErrorMessage(error: {
  message?: string
  hint?: string | null
}): string {
  const hint = error.hint?.trim()
  if (hint && HINT_COPY[hint]) return HINT_COPY[hint]
  const message = error.message ?? ''
  for (const key of Object.keys(HINT_COPY)) {
    if (message.includes(key)) return HINT_COPY[key]
  }
  return message.trim() || 'Something went wrong. Try again.'
}
