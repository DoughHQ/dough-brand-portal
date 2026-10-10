import type { MasterSku } from './types'

export function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `$${Number(n).toFixed(2)}`
}

/** Label data is often ALL CAPS — present as title case when the whole string is uppercase. */
export function displayProductName(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const letters = trimmed.replace(/[^A-Za-z]/g, '')
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .replace(/(^|[\s/(&\-])([a-z])/g, (_, p1: string, p2: string) => p1 + p2.toUpperCase())
  }
  return trimmed
}

export function formatJsonValue(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    const s = JSON.stringify(v)
    return s.length > 80 ? s.slice(0, 77) + '…' : s
  } catch {
    return String(v)
  }
}

export function relativeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s} second${s === 1 ? '' : 's'} ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

export function coveragePct(part: number, total: number): string {
  if (!total) return '0%'
  const pct = (part / total) * 100
  if (pct === 0) return '0%'
  if (pct < 0.1) return `${pct.toFixed(2)}%`
  if (pct < 1) return `${pct.toFixed(1)}%`
  if (pct < 10) return `${pct.toFixed(1)}%`
  return `${Math.round(pct)}%`
}

export function skuLabel(sku: MasterSku): string {
  const parts = [
    sku.variant_name_display,
    sku.package_size_value != null
      ? `${sku.package_size_value}${sku.package_size_uom ? ` ${sku.package_size_uom}` : ''}`
      : null,
    sku.package_type,
  ].filter(Boolean)
  return parts.join(' · ') || `SKU ${sku.sku_variant_id}`
}
