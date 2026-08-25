/** Measured sentence from focal-cut counts only. Never predicts. */
export function focalLeadSentence(above: number, tied: number, below: number): string {
  const bits: string[] = []
  if (tied > 0) {
    bits.push(`indistinguishable from ${tied} product${tied === 1 ? '' : 's'}`)
  }
  if (below > 0) {
    bits.push(`measurably ahead of ${below}`)
  }
  if (above > 0) {
    bits.push(`measurably behind ${above}`)
  }
  if (bits.length === 0) {
    return 'No measurable comparisons against this product yet.'
  }
  const joined =
    bits.length === 1 ? bits[0] : `${bits[0]}, ${bits.slice(1).join(', ')}`
  return joined.charAt(0).toUpperCase() + joined.slice(1) + '.'
}

export function formatElo(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return String(Math.round(value))
}

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString()
}

export function formatShare(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null
  return String(value)
}

export function formatBeta(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(3)
}

export function statisticsHeadline(s: {
  items_total: number | null
  separated_items: number | null
  components_found: number | null
  items_with_ci: number | null
}): string {
  const bits: string[] = []
  if (s.items_total != null) bits.push(`${formatCount(s.items_total)} items`)
  if (s.separated_items != null) bits.push(`${formatCount(s.separated_items)} separated`)
  if (s.components_found != null) {
    bits.push(
      `${formatCount(s.components_found)} component${s.components_found === 1 ? '' : 's'}`
    )
  }
  if (s.items_with_ci != null) {
    bits.push(`${formatCount(s.items_with_ci)} with intervals`)
  }
  return bits.join(' · ')
}

export function uniqueCiNotes(products: { ci_available: boolean; ci_note: string | null }[]): string[] {
  const seen = new Set<string>()
  const notes: string[] = []
  for (const p of products) {
    const n = p.ci_note?.trim()
    if (!p.ci_available && n && !seen.has(n)) {
      seen.add(n)
      notes.push(n)
    }
  }
  return notes
}

export function formatAsOf(iso: string | null): string {
  if (!iso) return 'Date unknown'
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (!Number.isFinite(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatSharePct(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null
  return `${Math.round(value * 1000) / 10}%`
}

/**
 * Payload-only claim sentences. Never invents counts.
 * Skips a beat when the needed fields are null (shows note elsewhere if any).
 */
export function claimLines(args: {
  separated_items: number | null
  items_total: number | null
  components_found: number | null
  items_with_ci: number | null
  distinct_raters: number
  products_with_battles: number | null
  products_ranked: number | null
  statistics_note: string | null
}): string[] {
  const lines: string[] = []

  if (args.separated_items != null && args.items_total != null) {
    lines.push(
      `${formatCount(args.separated_items)} of ${formatCount(args.items_total)} items are unbound.`
    )
  } else if (args.statistics_note) {
    lines.push(args.statistics_note)
  }

  if (args.components_found != null) {
    const n = args.components_found
    lines.push(
      n === 1
        ? '1 connected field.'
        : `${formatCount(n)} disconnected fields.`
    )
  }

  if (args.items_with_ci != null) {
    if (args.items_with_ci === 0) {
      const r = args.distinct_raters
      lines.push(
        r === 1
          ? 'No intervals — 1 rater.'
          : `No intervals — ${formatCount(r)} raters.`
      )
    } else {
      lines.push(
        `${formatCount(args.items_with_ci)} item${args.items_with_ci === 1 ? '' : 's'} with intervals.`
      )
    }
  }

  if (
    args.products_with_battles != null &&
    args.products_ranked != null &&
    args.products_with_battles !== args.products_ranked
  ) {
    lines.push(
      `${formatCount(args.products_with_battles)} of ${formatCount(args.products_ranked)} ranked products have battles.`
    )
  }

  return lines.slice(0, 3)
}

/** Quiet one-line caption under the page title — same facts as claimLines, no numbered list. */
export function claimCaption(
  args: Parameters<typeof claimLines>[0]
): string | null {
  const lines = claimLines(args)
  if (lines.length === 0) return null
  return lines.map((line) => line.replace(/\.$/, '')).join(' · ')
}

/** Focal-vs-opponent rows from pairwise only — never invent 1 − p. */
export function focalPairRows(
  pairs: {
    a_product_id: number
    a_name: string
    b_product_id: number
    b_name: string
    p_a_beats_b: number | null
    observed_a_wins: number | null
    observed_b_wins: number | null
    observed_n: number | null
    directly_compared: boolean
  }[],
  focalProductId: number
): {
  opponent_id: number
  opponent_name: string
  p_focal_beats: number | null
  observed_focal_wins: number | null
  observed_opp_wins: number | null
  observed_n: number | null
  directly_compared: boolean
}[] {
  const rows: {
    opponent_id: number
    opponent_name: string
    p_focal_beats: number | null
    observed_focal_wins: number | null
    observed_opp_wins: number | null
    observed_n: number | null
    directly_compared: boolean
  }[] = []

  for (const pair of pairs) {
    if (pair.a_product_id !== focalProductId) continue
    rows.push({
      opponent_id: pair.b_product_id,
      opponent_name: pair.b_name,
      p_focal_beats: pair.p_a_beats_b,
      observed_focal_wins: pair.observed_a_wins,
      observed_opp_wins: pair.observed_b_wins,
      observed_n: pair.observed_n,
      directly_compared: pair.directly_compared,
    })
  }
  return rows
}
