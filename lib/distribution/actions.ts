export type BrandStatus = 'active' | 'delisted' | null

export type DistributionAction =
  | 'claim'
  | 'confirm'
  | 'correct'
  | 'dispute'
  | 'withdraw'
  | 'delist'
  | 'redeclare'

/**
 * Compose actions from brand state × pending count.
 * Confirm is only for shopper reports (awaiting_review > 0).
 * Claim is for Dough-seed / evidence with no pending report.
 */
export function actionsForState(
  brandStatus: string | null | undefined,
  awaitingReview: number,
): DistributionAction[] {
  const pending = awaitingReview > 0
  const status = (brandStatus ?? null) as BrandStatus

  if (status === 'active') {
    return pending
      ? ['confirm', 'correct', 'dispute', 'withdraw', 'delist']
      : ['withdraw', 'delist']
  }
  if (status === 'delisted') {
    return pending ? ['confirm', 'correct', 'dispute', 'redeclare'] : ['redeclare']
  }
  return pending ? ['confirm', 'correct', 'dispute'] : ['claim']
}

export function claimLabel(): string {
  return 'Claim this'
}

export function claimLabelLong(): string {
  return 'Add this to your distribution'
}

export function confirmLabel(contradictsDelisting: boolean, delistedOn: string | null): string {
  if (contradictsDelisting && delistedOn) {
    return `Confirm — list as carried again (you marked delisted as of ${formatCalendarDate(delistedOn)})`
  }
  if (contradictsDelisting) {
    return 'Confirm — list as carried again (contradicts your delisting)'
  }
  return "Confirm — we'll add this to your distribution"
}

export function shopperLine(count: number, lastReportedOn: string | null): string {
  const n = Math.max(0, count)
  const who = n === 1 ? '1 shopper reported this' : `${n} shoppers reported this`
  if (!lastReportedOn) return who
  return `${who} · most recently ${formatCalendarDate(lastReportedOn)}`
}

/** Evidence dates under the shopper line — not action rows. */
export function shopperDatesLine(dates: string[]): string | null {
  const unique = [...new Set(dates.filter(Boolean))]
  if (unique.length === 0) return null
  const formatted = unique.map(formatCalendarDate)
  if (formatted.length === 1) return `Sighted ${formatted[0]}`
  if (formatted.length <= 4) return `Sighted ${formatted.join(', ')}`
  return `Sighted ${formatted.slice(0, 3).join(', ')} +${formatted.length - 3} more`
}

export function formatCalendarDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  if (!m) return isoDate
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${d} ${months[mo - 1]} ${y}`
}

export function formatRelativeTimestamp(iso: string | null): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const diffMs = Date.now() - t
  const days = Math.floor(diffMs / 86_400_000)
  if (days < 0) return formatCalendarDate(iso)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  }
  const years = Math.floor(days / 365)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

/** Short pack label for cards; keep full string as tooltip. */
export function shortVariantLabel(
  label: string | null | undefined,
  productTitle?: string | null,
): string {
  const raw = (label ?? '').trim()
  if (!raw) return 'All pack sizes'
  if (raw === 'All pack sizes' || raw === 'Pack size not recorded' || raw === 'Unnamed pack') {
    return raw
  }
  const title = (productTitle ?? '').trim()
  if (title && raw.toLowerCase().startsWith(title.toLowerCase())) {
    const rest = raw.slice(title.length).replace(/^[\s·\-–—:]+/, '').trim()
    if (rest) return rest
  }
  return raw
}
