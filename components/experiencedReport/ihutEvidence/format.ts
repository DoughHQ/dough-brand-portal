export function pct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const unit = value > 1 ? value / 100 : value
  return `${Math.round(unit * 1000) / 10}%`
}

export function unit(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return value > 1 ? value / 100 : value
}
