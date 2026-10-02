import { describe, expect, it } from 'vitest'
import {
  createEmptyConceptDraft,
  createEmptyConceptEligibility,
  newConceptArm,
  newProductCompetitor,
} from '../defaults'
import {
  conceptEligibilityToWire,
  draftToConceptPublishStudyArgs,
  draftToPublishPayload,
} from '../publish'
import { MODULE_CONCEPT_CORE_V1 } from '../singleTest'

function draftWithProduct(
  upc: string | null,
  extra: { product_id?: number; identityConfirmed?: boolean } = {}
) {
  return createEmptyConceptDraft({
    stimulusMode: 'package',
    conceptArms: [
      {
        ...newConceptArm(0),
        display_name: 'Arm',
        image_url: 'https://example.com/arm.png',
      },
      {
        ...newConceptArm(1),
        display_name: 'Alt',
        image_url: 'https://example.com/alt.png',
        battle_intent: 'hero',
      },
    ],
    products: [
      {
        ...newProductCompetitor(),
        product_id: extra.product_id ?? 30012404,
        frozen_display_name: 'Classic',
        frozen_brand_name: "Lay's",
        frozen_image_url: 'https://example.com/comp.png',
        upc,
        identityConfirmed: extra.identityConfirmed ?? !!upc,
      },
    ],
    templateConfig: {
      ...createEmptyConceptDraft().templateConfig,
      pack_size: 'pint',
      expected_price: '4.99',
      decoy_option: 'Frostline',
      verification_options: [
        { id: 'a', label: 'Brand A' },
        { id: 'b', label: 'Brand B' },
        { id: 'decoy', label: 'Frostline' },
        { id: 'none_of_these', label: 'None of these' },
      ],
    },
  })
}

describe('draftToPublishPayload battle_intent + upc', () => {
  it('sends hero on concept arms and competitor + upc on products', () => {
    const payload = draftToPublishPayload(draftWithProduct('028400017688'))
    expect(payload.concepts[0]?.battle_intent).toBe('hero')
    expect(payload.concepts[0]?.stimulus_type).toBe('package')
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
      frozen_image_url: 'https://example.com/bbq.png',
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
      frozen_image_url: 'https://example.com/again.png',
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

describe('draftToConceptPublishStudyArgs modules', () => {
  it('always publishes CONCEPT_CORE_V1', () => {
    const draft = draftWithProduct('028400017688')
    draft.taxonomyNodeId = 10
    draft.title = 'Pack test'
    draft.targetCompletions = 30
    const args = draftToConceptPublishStudyArgs(draft, {
      campaignId: 'camp-1',
      createdBy: 'user-1',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(args.p_test_type).toBe('concept')
    expect(args.p_modules).toEqual([MODULE_CONCEPT_CORE_V1])
    expect(args.p_price_posture).toBe('blind')
    expect(args.p_field.concepts).toHaveLength(2)
    expect(args.p_field.products).toHaveLength(1)
  })

  it('rejects non-package stimulus', () => {
    const draft = draftWithProduct('028400017688')
    draft.stimulusMode = 'price'
    draft.taxonomyNodeId = 10
    draft.title = 'Price test'
    expect(() =>
      draftToConceptPublishStudyArgs(draft, {
        campaignId: 'camp-1',
        createdBy: 'user-1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
    ).toThrow('CORE_REQUIRES_PACKAGE_STIMULUS')
  })
})

describe('conceptEligibilityToWire / p_eligibility', () => {
  const ctx = {
    campaignId: 'camp-1',
    createdBy: 'user-1',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  }

  it('omits p_eligibility when no rules are set', () => {
    const draft = draftWithProduct('028400017688')
    draft.taxonomyNodeId = 10
    draft.title = 'Pack test'
    draft.targetCompletions = 30
    const args = draftToConceptPublishStudyArgs(draft, ctx)
    expect(args).not.toHaveProperty('p_eligibility')
    expect(args).not.toHaveProperty('p_eligibility_tier')
    expect(conceptEligibilityToWire(draft)).toBeNull()
  })

  it('V1: omits eligibility on publish even when the draft has rules', () => {
    const draft = draftWithProduct('028400017688')
    draft.taxonomyNodeId = 10
    draft.title = 'Pack test'
    draft.targetCompletions = 30
    draft.eligibility = {
      ...createEmptyConceptEligibility(),
      targetStates: ['CA', 'NY'],
      minAge: 21,
      qualifyingTaxonomyNodeId: 44,
      minCategoryLevel: 3,
    }
    const args = draftToConceptPublishStudyArgs(draft, ctx)
    expect(args).not.toHaveProperty('p_eligibility')
    expect(args).not.toHaveProperty('p_eligibility_tier')
  })

  it('wire mapping sends only set keys when forced (audience builder on)', () => {
    const draft = draftWithProduct('028400017688')
    draft.eligibility = {
      ...createEmptyConceptEligibility(),
      targetStates: ['CA', 'NY'],
      minAge: 21,
      qualifyingTaxonomyNodeId: 44,
      minCategoryLevel: 3,
    }
    const wire = conceptEligibilityToWire(draft, { force: true })
    expect(wire).toMatchObject({
      target_states: ['CA', 'NY'],
      min_age: 21,
      qualifying_taxonomy_node_id: 44,
      min_category_level: 3,
    })
  })
})
