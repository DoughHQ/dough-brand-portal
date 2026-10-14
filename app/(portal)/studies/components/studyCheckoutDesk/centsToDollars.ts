export function centsToDollars(cents: number): string {
  const whole = Math.trunc(cents / 100)
  const frac = Math.abs(cents % 100)
  return `${whole}.${String(frac).padStart(2, '0')}`
}
