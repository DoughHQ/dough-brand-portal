/**
 * Money on a study order is stored in cents. Formatting divides by 100 for
 * display. It never multiplies completions by a unit price.
 */

export function formatOrderMoney(amountCents: number, currency: string): string {
  const code = currency.trim().toUpperCase()
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
  }).format(amountCents / 100)
}

/** Staff type a dollar amount. Rejects anything other than cents. */
export function dollarsToCents(raw: string): number | null {
  const text = raw.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null
  const [whole, frac = ''] = text.split('.')
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents <= 0) return null
  return cents
}
