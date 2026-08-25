import { describe, expect, it } from 'vitest'
import {
  BrandPortalProfileError,
  friendlyProfileError,
  normalizeHandle,
  shapeFieldPatch,
} from '../brandHome/updateBrandPortalProfile'

describe('normalizeHandle', () => {
  it('strips leading @ and trims', () => {
    expect(normalizeHandle('  @odwalla  ')).toBe('odwalla')
    expect(normalizeHandle('@@odwalla')).toBe('odwalla')
    expect(normalizeHandle('odwalla')).toBe('odwalla')
    expect(normalizeHandle('')).toBe(null)
    expect(normalizeHandle('   ')).toBe(null)
    expect(normalizeHandle(null)).toBe(null)
  })
})

describe('shapeFieldPatch', () => {
  it('shapes handle fields without @', () => {
    expect(shapeFieldPatch('instagram_handle', '@Foo')).toEqual({
      instagram_handle: 'Foo',
    })
  })

  it('clears empty strings to null', () => {
    expect(shapeFieldPatch('about_text', '  ')).toEqual({ about_text: null })
    expect(shapeFieldPatch('brand_website_url', '')).toEqual({
      brand_website_url: null,
    })
    expect(shapeFieldPatch('founded_year', '')).toEqual({ founded_year: null })
  })

  it('parses founded year as integer', () => {
    expect(shapeFieldPatch('founded_year', '1980')).toEqual({ founded_year: 1980 })
  })

  it('rejects non-integer founded year before RPC', () => {
    expect(() => shapeFieldPatch('founded_year', 'nineteen')).toThrow(
      BrandPortalProfileError
    )
  })
})

describe('friendlyProfileError', () => {
  it('maps known RPC codes', () => {
    expect(friendlyProfileError('founded_year_out_of_range')).toMatch(/valid founding year/i)
    expect(friendlyProfileError('ERROR: field_not_editable')).toMatch(/can’t be changed/i)
    expect(friendlyProfileError('no_effective_brand')).toMatch(/session/i)
    expect(friendlyProfileError('something weird')).toMatch(/try again/i)
  })
})
