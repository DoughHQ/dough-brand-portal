export const FIELDING_DAYS_MIN = 7

const TOO_SHORT = 'A study needs at least 7 days to run.'

/** A positive whole number of days, kept even when it is under 7. Anything else is no end date. */
export function fieldingDaysOrNone(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const n = Number(raw.trim())
    if (n > 0) return n
  }
  return null
}

export function fieldingDaysMessage(days: number | null): string | null {
  if (days == null) return null
  if (!Number.isInteger(days) || days < FIELDING_DAYS_MIN) return TOO_SHORT
  return null
}

/** Timestamp the publisher sends so the database can recover the day count. The clock starts at payment. */
export function expiresAtFromFieldingDays(days: number, now = new Date()): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString()
}

/** Eastern calendar day the length would end if payment happened at `now`. */
export function fieldingEndDateLabel(days: number, now = new Date()): string {
  const end = new Date(now.getTime() + days * 86_400_000)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(end)
}

/** “14 days · ends Oct 15 if paid today.” The date is Eastern, because that is the brand’s day. */
export function fieldingEndPreview(days: number, now = new Date()): string {
  return `${days} days · ends ${fieldingEndDateLabel(days, now)} if paid today`
}
