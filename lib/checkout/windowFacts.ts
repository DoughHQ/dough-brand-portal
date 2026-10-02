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
  settled: boolean
  now?: Date
}): CheckoutWindowFacts {
  const now = input.now ?? new Date()
  const days = fieldingDaysMessage(input.fieldingDays) ? null : input.fieldingDays
  const liveEnd = input.settled ? formatLiveEnd(input.expiresAt) : null

  if (days == null && !liveEnd) {
    return {
      responses: input.completions.toLocaleString('en-US'),
      length: 'No end date',
      lengthNote: 'Until responses are in',
      end: 'When full',
      endNote: 'Closes with the last response',
    }
  }

  return {
    responses: input.completions.toLocaleString('en-US'),
    length: days == null ? 'No end date' : `${days} days`,
    lengthNote: input.settled ? 'From the day it was paid' : "Once it's paid",
    end: liveEnd ?? (days == null ? 'When full' : fieldingEndDateLabel(days, now)),
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
