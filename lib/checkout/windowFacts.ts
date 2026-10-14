import { fieldingDaysMessage, fieldingEndDateLabel } from '@/lib/studies/fieldingWindow'

export type CheckoutWindowFacts = {
  responses: string
  length: string
  lengthNote: string
  end: string
  endNote: string
}

/** The three facts under the packs. A date before payment is a preview, not the live deadline. */
export function checkoutWindowFacts(input: {
  completions: number
  fieldingDays: number | null
  expiresAt: string | null
  /** True once the order is paid or waived (study can go live). */
  orderPaidOrWaived: boolean
  now?: Date
}): CheckoutWindowFacts {
  const now = input.now ?? new Date()
  const days = fieldingDaysMessage(input.fieldingDays) ? null : input.fieldingDays
  const liveEnd = input.orderPaidOrWaived ? formatLiveEnd(input.expiresAt) : null

  if (days == null) {
    return {
      responses: input.completions.toLocaleString('en-US'),
      length: 'Until full',
      lengthNote: 'Up to 90 days',
      end: liveEnd ?? 'When full',
      endNote: liveEnd
        ? 'At the latest'
        : 'Or 90 days after it goes live',
    }
  }

  return {
    responses: input.completions.toLocaleString('en-US'),
    length: `${days} days`,
    lengthNote: input.orderPaidOrWaived ? 'From the day it was paid' : "Once it's paid",
    end: liveEnd ?? fieldingEndDateLabel(days, now),
    endNote: liveEnd ? 'Live end' : 'If paid today',
  }
}

function formatLiveEnd(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(date)
}
