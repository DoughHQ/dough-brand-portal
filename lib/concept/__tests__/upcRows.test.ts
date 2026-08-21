import { describe, expect, it } from 'vitest'
import { newProductCompetitor } from '../defaults'
import { resolvePublishError } from '../errors'
import { conceptProductRowErrors } from '../validity'

describe('conceptProductRowErrors', () => {
  it('attaches a missing-SKU error to the competitor row', () => {
    const missing = {
      ...newProductCompetitor(),
      product_id: 2,
      frozen_display_name: 'BBQ',
      upc: null,
    }
    const ok = {
      ...newProductCompetitor(),
      product_id: 1,
      frozen_display_name: 'Classic',
      upc: '028400017688',
      identityConfirmed: true,
    }
    const errors = conceptProductRowErrors([ok, missing])
    expect(errors[missing.localId]).toMatch(/SKU/i)
    expect(errors[ok.localId]).toBeUndefined()
  })

  it('attaches UPC_PRODUCT_MISMATCH to the matching product row', () => {
    const row = {
      ...newProductCompetitor(),
      product_id: 30012404,
      upc: '028400017688',
      identityConfirmed: true,
    }
    const errors = conceptProductRowErrors([row], {
      hint: 'UPC_PRODUCT_MISMATCH',
      productId: 30012404,
    })
    expect(errors[row.localId]).toMatch(/does not belong/i)
  })
})

describe('resolvePublishError locators', () => {
  it('parses product_id from JSON detail for UPC HINTs', () => {
    const resolved = resolvePublishError({
      returned: {
        error: 'UPC_PRODUCT_MISMATCH',
        detail: { product_id: 30012404, upc: '028400017688' },
      },
    })
    expect(resolved.section).toBe('field')
    expect(resolved.productId).toBe(30012404)
    expect(resolved.upc).toBe('028400017688')
    expect(resolved.text).toMatch(/does not belong/i)
  })
})
