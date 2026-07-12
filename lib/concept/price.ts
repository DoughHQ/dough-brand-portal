/** Parse operator price input. Never parseInt / floor / round. */
export function parsePriceAmount(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null
  }
  const t = raw.trim().replace(/^\$/, '')
  if (!t) return null
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : null
}

/** True when the field has a finite price (blank = unpriced). */
export function isPriced(raw: string | number | null | undefined): boolean {
  return parsePriceAmount(raw) != null
}

/**
 * Allow intermediate decimal typing: "", "4", "4.", "4.9", "4.99".
 * Rejects letters and more than 2 decimal places.
 */
export function isAllowedPriceInput(raw: string): boolean {
  const t = raw.trim().replace(/^\$/, '')
  if (!t) return true
  return /^\d*\.?\d{0,2}$/.test(t)
}

/** Format wire price: blank → null; otherwise decimal string without float noise. */
export function priceToWire(
  raw: string | number | null | undefined
): string | null {
  const n = parsePriceAmount(raw)
  if (n == null) return null
  // Keep cents when present (4.99), drop trailing .00 for whole dollars (5 → "5").
  const fixed = n.toFixed(2)
  if (fixed.endsWith('.00')) return String(Math.trunc(n))
  return fixed
}

/** Format for display prompts like floor copy. */
export function formatPriceLabel(
  raw: string | number | null | undefined
): string | null {
  const n = parsePriceAmount(raw)
  if (n == null) return null
  return n.toFixed(2)
}
