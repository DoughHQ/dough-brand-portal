/**
 * Price helpers for packaging template config.
 * - price_display: free text shown in respondent copy ("$4.99")
 * - expected_price: raw number string used as the publish-time band anchor ("8.99")
 * Bands are generated at publish; client only previews them.
 */

export function parsePriceDisplay(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Mirror server: bare "4.99" → "$4.99" in respondent copy. */
export function formatPriceDisplay(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const n = parsePriceDisplay(trimmed)
  if (n == null) return trimmed
  return `$${n.toFixed(2)}`
}

/** Strip currency / noise → raw "8.99" for expected_price wire. */
export function normalizeExpectedPrice(raw: string): string {
  const n = parsePriceDisplay(raw)
  if (n == null) return ''
  return n.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function bandStep(price: number): number {
  if (price < 5) return 1
  if (price < 15) return 2
  if (price < 50) return 5
  return 10
}

function fmtDollar(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/, '')
}

/**
 * Preview / publish band generator from an expected (or display) price.
 * step = P<5?1 : P<15?2 : P<50?5 : 10
 * lower = floor(P/step)*step
 * $4.99 → Under $3 · $3–4 · $4–5 · $5–6 · Over $6
 * When lower-step < 0, drop Under and start at $0–{step}.
 */
export function generatePriceBands(priceRaw: string): string[] {
  const price = parsePriceDisplay(priceRaw)
  if (price == null) return []

  const step = bandStep(price)
  const lower = Math.floor(price / step) * step
  const underBound = lower - step

  if (underBound < 0) {
    return [
      `$0–${fmtDollar(step)}`,
      `$${fmtDollar(step)}–${fmtDollar(step * 2)}`,
      `$${fmtDollar(step * 2)}–${fmtDollar(step * 3)}`,
      `Over $${fmtDollar(step * 3)}`,
    ]
  }

  return [
    `Under $${fmtDollar(underBound)}`,
    `$${fmtDollar(underBound)}–${fmtDollar(lower)}`,
    `$${fmtDollar(lower)}–${fmtDollar(lower + step)}`,
    `$${fmtDollar(lower + step)}–${fmtDollar(lower + 2 * step)}`,
    `Over $${fmtDollar(lower + 2 * step)}`,
  ]
}

export type ParsedBand =
  | { kind: 'under'; max: number }
  | { kind: 'over'; min: number }
  | { kind: 'range'; min: number; max: number }

/** Parse "Under $3" / "$3–4" / "$3-4" / "Over $6". */
export function parseBand(raw: string): ParsedBand | null {
  const s = raw.trim().replace(/\u2013|\u2014/g, '-')
  if (!s) return null

  const under = /^under\s*\$?\s*([\d.]+)$/i.exec(s)
  if (under) {
    const max = Number(under[1])
    return Number.isFinite(max) ? { kind: 'under', max } : null
  }

  const over = /^over\s*\$?\s*([\d.]+)$/i.exec(s)
  if (over) {
    const min = Number(over[1])
    return Number.isFinite(min) ? { kind: 'over', min } : null
  }

  const range = /^\$?\s*([\d.]+)\s*[-–]\s*\$?\s*([\d.]+)$/i.exec(s)
  if (range) {
    const min = Number(range[1])
    const max = Number(range[2])
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null
    return { kind: 'range', min, max }
  }

  return null
}

export type BandValidationError = {
  code: string
  message: string
}

/**
 * Contiguous, open-ended only at ends, shelf price inside a bounded band.
 */
export function validatePriceBands(
  bands: string[],
  priceDisplay: string
): BandValidationError[] {
  const errors: BandValidationError[] = []
  const filled = bands.map((b) => b.trim()).filter(Boolean)
  if (filled.length < 4 || filled.length > 5) {
    errors.push({
      code: 'BAND_COUNT',
      message: 'Price bands needs 4–5 answers bracketing the shelf price.',
    })
    return errors
  }

  const parsed = filled.map(parseBand)
  if (parsed.some((p) => p == null)) {
    errors.push({
      code: 'BAND_PARSE',
      message: 'Each band must look like Under $3, $3–4, or Over $6.',
    })
    return errors
  }
  const bandsParsed = parsed as ParsedBand[]

  const underCount = bandsParsed.filter((b) => b.kind === 'under').length
  const overCount = bandsParsed.filter((b) => b.kind === 'over').length
  if (underCount !== 1 || overCount !== 1) {
    errors.push({
      code: 'BAND_OPEN_ENDS',
      message: 'Price bands need exactly one “Under …” and one “Over …”.',
    })
  }
  if (bandsParsed[0]?.kind !== 'under' && bandsParsed[0]?.kind !== 'range') {
    errors.push({
      code: 'BAND_ORDER',
      message: 'The first band should be open-ended low (Under …) or start at $0.',
    })
  }
  if (bandsParsed[bandsParsed.length - 1]?.kind !== 'over') {
    errors.push({
      code: 'BAND_ORDER',
      message: 'The last band must be “Over …”.',
    })
  }

  // Contiguity: walk ranges / under.max → next.min
  const edges: number[] = []
  for (const b of bandsParsed) {
    if (b.kind === 'under') edges.push(b.max)
    else if (b.kind === 'range') {
      edges.push(b.min, b.max)
    } else edges.push(b.min)
  }
  // Check adjacent handoff: under.max == next.min, range.max == next.min, etc.
  for (let i = 0; i < bandsParsed.length - 1; i++) {
    const a = bandsParsed[i]!
    const b = bandsParsed[i + 1]!
    const aEnd = a.kind === 'under' ? a.max : a.kind === 'range' ? a.max : a.min
    const bStart = b.kind === 'over' ? b.min : b.kind === 'range' ? b.min : b.max
    if (Math.abs(aEnd - bStart) > 0.001) {
      errors.push({
        code: 'BAND_GAP',
        message: 'Price bands must be contiguous — no gaps or overlaps.',
      })
      break
    }
  }

  const price = parsePriceDisplay(priceDisplay)
  if (price != null) {
    const inBounded = bandsParsed.some(
      (b) => b.kind === 'range' && price >= b.min && price < b.max + 1e-9
    )
    // Also allow price at exact upper bound of a range (inclusive left, inclusive right for last cent)
    const inBoundedInclusive = bandsParsed.some((b) => {
      if (b.kind !== 'range') return false
      return price >= b.min && price <= b.max
    })
    if (!inBounded && !inBoundedInclusive) {
      errors.push({
        code: 'BAND_PRICE_OUTSIDE',
        message:
          'Shelf price must fall inside a bounded band (not Under/Over) — regenerate from shelf price.',
      })
    }
  }

  return errors
}
