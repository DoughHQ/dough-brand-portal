/** Display a 0..1 rate as a whole-number percentage for DM Mono. */
export function formatPct(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return '—'
  return `${Math.round(rate * 100)}%`
}

/** Surface counts from a withheld reason when the backend includes them. */
export function parseWithheldProgress(reason: string | undefined): string | null {
  if (!reason?.trim()) return null
  const ofMatch = reason.match(/(\d+)\s*of\s*(\d+)/i)
  if (ofMatch) return `${ofMatch[1]} of ${ofMatch[2]} needed`
  return reason.trim()
}

const MONTHS_SHORT = [
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
] as const

/**
 * Deterministic UTC stamp for SSR Client Components.
 * Never use toLocaleString / dateStyle / timeStyle across the hydration boundary —
 * Node ICU vs browser produces different strings (e.g. comma vs "at").
 */
export function formatUtcStamp(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  const month = MONTHS_SHORT[d.getUTCMonth()]
  const day = d.getUTCDate()
  const year = d.getUTCFullYear()
  let hour = d.getUTCHours()
  const minute = String(d.getUTCMinutes()).padStart(2, '0')
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return `${month} ${day}, ${year} · ${hour}:${minute} ${ampm} UTC`
}
