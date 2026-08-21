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
