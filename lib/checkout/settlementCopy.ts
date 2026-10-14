import { formatOrderMoney } from './money'
import { isOrderSettled, type StudyOrderRow } from './payment'

export type CheckoutMissionStatus =
  | 'active'
  | 'paused'
  | 'scheduled'
  | 'in_review'
  | 'expired'
  | 'completed'
  | 'archived'
  | 'draft'
  | string

export function isMissionEnded(status: CheckoutMissionStatus | null | undefined): boolean {
  return (
    status === 'expired' ||
    status === 'completed' ||
    status === 'archived'
  )
}

/** Brand-facing checkout lede after payment. */
export function checkoutLede(input: {
  orderPaidOrWaived: boolean
  missionStatus: CheckoutMissionStatus | null
}): string {
  if (!input.orderPaidOrWaived) {
    return 'A blind read of these packs, from real shoppers.'
  }
  if (isMissionEnded(input.missionStatus)) {
    return 'This study has ended.'
  }
  return 'This study is live.'
}

function easternDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(date)
}

/**
 * Settlement lines for a paid/waived order after the report settles.
 * Money strings come only from formatOrderMoney — never recomputed in the UI.
 */
export function checkoutSettlementLines(
  order: StudyOrderRow
): string[] {
  if (!isOrderSettled(order)) return []

  const lines: string[] = []
  if (order.delivered_completions != null) {
    lines.push(
      `${order.delivered_completions.toLocaleString('en-US')} response${
        order.delivered_completions === 1 ? '' : 's'
      } delivered.`
    )
  }

  if (order.refunded_at != null && order.refunded_cents != null) {
    const amount = formatOrderMoney(order.refunded_cents, order.currency)
    const when = easternDate(order.refunded_at)
    const dateBit = when ? ` on ${when}` : ''
    const refBit = order.refund_reference ? ` · ${order.refund_reference}` : ''
    if (order.refund_method === 'credit') {
      lines.push(`${amount} was credited toward your next study${dateBit}${refBit}.`)
    } else {
      lines.push(`${amount} was refunded${dateBit}${refBit}.`)
    }
    return lines
  }

  if (order.refund_due_cents != null && order.refund_due_cents > 0) {
    lines.push(
      `${formatOrderMoney(order.refund_due_cents, order.currency)} is owed back to you. We'll confirm here when it's sent.`
    )
    return lines
  }

  if (order.refund_due_cents === 0) {
    lines.push('Nothing is owed back on this order.')
  }

  return lines
}

