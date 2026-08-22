import { describe, expect, it } from 'vitest'
import { resolveBoxPublishError, sectionForBoxCode } from '../errors'

describe('box UPC HINT mapping', () => {
  it.each([
    'UPC_REQUIRED',
    'UPC_INVALID',
    'UPC_PRODUCT_MISMATCH',
    'DUPLICATE_FIELD_UPC',
    'DUPLICATE_FIELD_PRODUCT',
  ])('maps %s to the field section', (code) => {
    expect(sectionForBoxCode(code)).toBe('field')
  })

  it('prefers mapped copy and parses product_id from JSON detail', () => {
    const resolved = resolveBoxPublishError({
      returned: {
        error: 'UPC_PRODUCT_MISMATCH',
        detail: { product_id: 30012404, upc: '028400017688' },
      },
    })
    expect(resolved.section).toBe('field')
    expect(resolved.code).toBe('UPC_PRODUCT_MISMATCH')
    expect(resolved.productId).toBe(30012404)
    expect(resolved.upc).toBe('028400017688')
    expect(resolved.text).toMatch(/doesn't belong/i)
  })
})

describe('box open-on-publish HINT mapping', () => {
  it.each([
    ['BOX_OPEN_FIELD_EMPTY', 'field'],
    ['BOX_OPEN_FIELD_TOO_SMALL', 'field'],
    ['BOX_OPEN_OUTSIDE_WINDOW', 'logistics'],
    ['BOX_OPEN_FAILED', 'publish'],
    ['BOX_OPEN_NO_PROTOCOL', 'publish'],
  ] as const)('maps %s to %s', (code, section) => {
    expect(sectionForBoxCode(code)).toBe(section)
    const resolved = resolveBoxPublishError({
      thrown: { message: `cannot open box x`, hint: code },
    })
    expect(resolved.code).toBe(code)
    expect(resolved.section).toBe(section)
    expect(resolved.text).toMatch(/publish|two products|end date/i)
  })

  it('maps a raw cannot-open exception to the friendly publish copy', () => {
    const resolved = resolveBoxPublishError({
      thrown: {
        message: 'cannot open box abc: only 1 combatant(s) frozen; a battle needs at least 2',
      },
    })
    expect(resolved.code).toBe('BOX_OPEN_FAILED')
    expect(resolved.text).toBe("Couldn't publish — check the box is complete.")
  })
})
