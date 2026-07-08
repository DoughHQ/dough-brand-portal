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
