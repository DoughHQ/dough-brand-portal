import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft, newConceptArm, newProductCompetitor } from '../defaults'
import { draftToPublishPayload } from '../publish'

function draftWithProduct(
  upc: string | null,
  extra: { product_id?: number; identityConfirmed?: boolean } = {}
) {
  return createEmptyConceptDraft({
    stimulusMode: 'package',
    conceptArms: [{ ...newConceptArm(0), display_name: 'Arm' }],
    products: [
      {
        ...newProductCompetitor(),
        product_id: extra.product_id ?? 30012404,
        frozen_display_name: 'Classic',
        frozen_brand_name: "Lay's",
        upc,
        identityConfirmed: extra.identityConfirmed ?? !!upc,
      },
    ],
  })
}

describe('draftToPublishPayload battle_intent + upc', () => {
  it('sends hero on concept arms and competitor + upc on products', () => {
    const payload = draftToPublishPayload(draftWithProduct('028400017688'))
    expect(payload.concepts[0]?.battle_intent).toBe('hero')
    expect(payload.products).toEqual([
      expect.objectContaining({
        product_id: 30012404,
        battle_intent: 'competitor',
        upc: '028400017688',
      }),
    ])
    expect(payload.products[0]).not.toHaveProperty('barcodeOptions')
    expect(payload.concepts[0]).not.toHaveProperty('upc')
  })

  it('throws UPC_REQUIRED instead of dropping competitors without a barcode', () => {
    expect(() => draftToPublishPayload(draftWithProduct(null))).toThrow('UPC_REQUIRED')
  })

  it('throws DUPLICATE_FIELD_UPC when two competitors share a barcode', () => {
    const draft = draftWithProduct('028400017688')
    draft.products.push({
      ...newProductCompetitor(),
      product_id: 30012405,
      frozen_display_name: 'BBQ',
      frozen_brand_name: "Lay's",
      upc: '028400017688',
      identityConfirmed: true,
    })
    expect(() => draftToPublishPayload(draft)).toThrow('DUPLICATE_FIELD_UPC')
  })

  it('throws DUPLICATE_COMPETITOR when the same product is added twice', () => {
    const draft = draftWithProduct('028400017688')
    draft.products.push({
      ...newProductCompetitor(),
      product_id: 30012404,
      frozen_display_name: 'Classic again',
      frozen_brand_name: "Lay's",
      upc: '028400017695',
      identityConfirmed: true,
    })
    expect(() => draftToPublishPayload(draft)).toThrow('DUPLICATE_COMPETITOR')
  })

  it('throws UPC_REQUIRED when a competitor is not yet confirmed', () => {
    expect(() =>
      draftToPublishPayload(draftWithProduct('028400017688', { identityConfirmed: false }))
    ).toThrow('UPC_REQUIRED')
  })
})
