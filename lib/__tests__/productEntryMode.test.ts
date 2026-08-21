import { describe, expect, it } from 'vitest'
import { isIdentityConfirmed, resolveEntryMode } from '../productEntryMode'

describe('resolveEntryMode', () => {
  it('auto-switches to barcode when the query looks like a GTIN and mode is not forced', () => {
    expect(resolveEntryMode(null, '028400017688')).toBe('barcode')
    expect(resolveEntryMode(null, 'lays classic')).toBe('name')
  })

  it('keeps an explicit Name toggle even when the query is all digits', () => {
    expect(resolveEntryMode('name', '028400017688')).toBe('name')
  })

  it('keeps an explicit Barcode toggle even when the query looks like a name', () => {
    expect(resolveEntryMode('barcode', 'lays classic')).toBe('barcode')
  })
})

describe('isIdentityConfirmed', () => {
  it('treats legacy rows with a UPC as confirmed', () => {
    expect(isIdentityConfirmed({ upc: '028400017688' })).toBe(true)
    expect(isIdentityConfirmed({ upc: null })).toBe(false)
  })

  it('does not treat a new pick as confirmed until the operator says so', () => {
    expect(isIdentityConfirmed({ upc: '028400017688', identityConfirmed: false })).toBe(false)
    expect(isIdentityConfirmed({ upc: '028400017688', identityConfirmed: true })).toBe(true)
  })
})
