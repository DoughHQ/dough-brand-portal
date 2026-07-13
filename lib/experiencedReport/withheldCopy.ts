/** Plain-language withheld reasons — no fabricated numbers. */

export function plainWithheldReason(
  reason: string | null | undefined,
  counts?: {
    n_answers?: number | null
    n_decisive?: number | null
    n_users?: number | null
    n_positive?: number | null
    n_citing?: number | null
    floor?: number | null
  }
): string {
  if (!reason || !reason.trim()) {
    return 'Not enough data to report this reliably yet.'
  }

  const r = reason.trim()
  const floorMatch = r.match(/n_answers\s*=\s*(\d+)\s*<\s*(\d+)/i)
  if (floorMatch) {
    return `Not enough answers yet — ${floorMatch[1]} of ${floorMatch[2]} needed.`
  }

  const decisiveMatch = r.match(/n_decisive\s*=\s*(\d+)\s*<\s*(\d+)/i)
  if (decisiveMatch) {
    return `Not enough decisive battles yet — ${decisiveMatch[1]} of ${decisiveMatch[2]} needed.`
  }

  if (/insufficient_users_for_variance|n_with_baseline\s*=\s*0/i.test(r)) {
    const nNo = counts?.n_users
    if (typeof nNo === 'number') {
      return `Lift not measurable — respondents had no prior baseline to compare against.`
    }
    return 'Lift not measurable — no prior baseline preference history for these respondents.'
  }

  if (/below_reporting_floor/i.test(r)) {
    const n = counts?.n_answers ?? counts?.n_decisive ?? counts?.n_citing
    const floor = counts?.floor
    if (n != null && floor != null) {
      return `Not enough observations yet — ${n} of ${floor} needed.`
    }
    if (n != null) {
      return `Not enough observations yet (n=${n}).`
    }
    return 'Below the reporting floor for this slice.'
  }

  // Soften snake_case codes for display
  if (/^[a-z0-9_:<>=.\s-]+$/i.test(r) && r.includes('_')) {
    return r
      .replace(/:/g, ' — ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return r
}

export function formatOf100(value: number): string {
  // value is 0–1 proportion
  const n = value <= 1 ? Math.round(value * 100) : Math.round(value)
  return String(n)
}

export function formatPct01(value: number): string {
  const pct = value <= 1 ? value * 100 : value
  return `${Math.round(pct)}%`
}

export function formatSnapshotDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
