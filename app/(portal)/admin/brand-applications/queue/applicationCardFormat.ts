import { formatUtcStamp } from '@/lib/portal-ui/format'

export function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  return formatUtcStamp(iso)
}

export function formatProductsShort(n: number): string {
  const count = Math.max(0, Math.trunc(n))
  return count === 1 ? '1 product' : `${count.toLocaleString()} products`
}
