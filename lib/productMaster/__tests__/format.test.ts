import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  coveragePct,
  displayProductName,
  formatJsonValue,
  formatMoney,
  relativeAgo,
  skuLabel,
} from '../format'
import type { MasterSku } from '../types'

afterEach(() => {
  vi.useRealTimers()
})

describe('formatMoney', () => {
  it('formats dollars to two places', () => {
    expect(formatMoney(3.5)).toBe('$3.50')
    expect(formatMoney(0)).toBe('$0.00')
  })

  it('returns an em dash for nullish or NaN', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
    expect(formatMoney(Number.NaN)).toBe('—')
  })
})

describe('displayProductName', () => {
  it('title-cases all-caps labels', () => {
    expect(displayProductName('SWEET & SALTY')).toBe('Sweet & Salty')
  })

  it('leaves mixed-case names alone', () => {
    expect(displayProductName('Kind Bars')).toBe('Kind Bars')
  })

  it('returns empty for blank input', () => {
    expect(displayProductName(null)).toBe('')
    expect(displayProductName('   ')).toBe('')
  })
})

describe('formatJsonValue', () => {
  it('stringifies primitives and truncates long JSON', () => {
    expect(formatJsonValue(null)).toBe('—')
    expect(formatJsonValue('ok')).toBe('ok')
    expect(formatJsonValue(12)).toBe('12')
    const long = formatJsonValue({ a: 'x'.repeat(100) })
    expect(long.endsWith('…')).toBe(true)
    expect(long.length).toBe(78)
  })
})

describe('relativeAgo', () => {
  it('formats seconds through days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'))
    expect(relativeAgo('2026-01-01T11:59:50.000Z')).toBe('10 seconds ago')
    expect(relativeAgo('2026-01-01T11:50:00.000Z')).toBe('10 minutes ago')
    expect(relativeAgo('2026-01-01T10:00:00.000Z')).toBe('2 hours ago')
    expect(relativeAgo('2025-12-30T12:00:00.000Z')).toBe('2 days ago')
  })
})

describe('coveragePct', () => {
  it('handles zero total and small fractions', () => {
    expect(coveragePct(0, 0)).toBe('0%')
    expect(coveragePct(0, 100)).toBe('0%')
    expect(coveragePct(1, 10000)).toBe('0.01%')
    expect(coveragePct(5, 1000)).toBe('0.5%')
    expect(coveragePct(5, 100)).toBe('5.0%')
    expect(coveragePct(50, 100)).toBe('50%')
  })
})

describe('skuLabel', () => {
  it('joins variant, size, and package type', () => {
    const sku = {
      sku_variant_id: 9,
      variant_name_display: 'Family',
      package_size_value: 12,
      package_size_uom: 'oz',
      package_type: 'bag',
      barcode: null,
    } as MasterSku
    expect(skuLabel(sku)).toBe('Family · 12 oz · bag')
  })

  it('falls back to the SKU id', () => {
    const sku = {
      sku_variant_id: 42,
      variant_name_display: null,
      package_size_value: null,
      package_size_uom: null,
      package_type: null,
      barcode: null,
    } as MasterSku
    expect(skuLabel(sku)).toBe('SKU 42')
  })
})
