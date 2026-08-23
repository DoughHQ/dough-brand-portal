import { describe, expect, it } from 'vitest'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '../defaults'
import { draftToBoxPublishArgs } from '../publish'
import { MODULE_LOYALTY } from '@/lib/study/modules'
import type { BoxFieldRow, BoxStudyDraft } from '../types'

function fieldRow(
  productId: number,
  upc: string | null,
  extra: Partial<BoxFieldRow> = {}
): BoxFieldRow {
  return {
    ...createEmptyBoxFieldRow(),
    product_id: productId,
    frozen_display_name: `Product ${productId}`,
    frozen_brand_name: 'Brand',
    upc,
    identityConfirmed: extra.identityConfirmed ?? !!upc,
    ...extra,
  }
}

function boxDraft(overrides: Partial<BoxStudyDraft> = {}): BoxStudyDraft {
  const base = createEmptyBoxDraft(42)
  return {
    ...base,
    title: 'NYC gluten-free box',
    taxonomyNodeId: 10,
    focalProductId: 30012404,
    fieldProducts: [
      fieldRow(30012404, '028400017688'),
      fieldRow(30012405, '028400017695'),
    ],
    physicalUnits: 50,
    ...overrides,
  }
}

const ctx = { campaignId: 'camp-1', createdBy: 'user-1' }

describe('draftToBoxPublishArgs UPC wire', () => {
  it('sends field + focal under p_field for publish_study', () => {
    const args = draftToBoxPublishArgs(boxDraft(), ctx)
    expect(args.p_test_type).toBe('ihut')
    expect(args.p_field.focal_product_id).toBe(30012404)
    expect(args.p_field.box_products).toEqual([
      { product_id: 30012404, upc: '028400017688' },
      { product_id: 30012405, upc: '028400017695' },
    ])
    expect(args.p_field.box_products[0]).not.toHaveProperty('barcodeOptions')
    expect(args.p_field.box_products[0]).not.toHaveProperty('frozen_display_name')
  })

  it('throws UPC_REQUIRED instead of dropping rows without a barcode', () => {
    const draft = boxDraft({
      fieldProducts: [
        fieldRow(30012404, '028400017688'),
        fieldRow(30012405, null),
      ],
    })
    expect(() => draftToBoxPublishArgs(draft, ctx)).toThrow('UPC_REQUIRED')
  })

  it('throws UPC_REQUIRED when a product has a UPC that is not yet confirmed', () => {
    const draft = boxDraft({
      fieldProducts: [
        fieldRow(30012404, '028400017688'),
        fieldRow(30012405, '028400017695', { identityConfirmed: false }),
      ],
    })
    expect(() => draftToBoxPublishArgs(draft, ctx)).toThrow('UPC_REQUIRED')
  })

  it('throws DUPLICATE_FIELD_UPC when two packages share a barcode', () => {
    const draft = boxDraft({
      fieldProducts: [
        fieldRow(30012404, '028400017688'),
        fieldRow(30012405, '028400017688'),
      ],
    })
    expect(() => draftToBoxPublishArgs(draft, ctx)).toThrow('DUPLICATE_FIELD_UPC')
  })
})

describe('draftToBoxPublishArgs battle prompt', () => {
  it('omits p_battle_prompt when the field is blank', () => {
    expect(draftToBoxPublishArgs(boxDraft(), ctx)).not.toHaveProperty(
      'p_battle_prompt'
    )
    expect(
      draftToBoxPublishArgs(boxDraft({ battleQuestion: '   ' }), ctx)
    ).not.toHaveProperty('p_battle_prompt')
  })

  it('sends the trimmed custom question', () => {
    expect(
      draftToBoxPublishArgs(
        boxDraft({ battleQuestion: '  Which would you grab for lunch?  ' }),
        ctx
      ).p_battle_prompt
    ).toBe('Which would you grab for lunch?')
  })
})

describe('draftToBoxPublishArgs loyalty module / p_open', () => {
  it('derives session count from MODULE_LOYALTY, not a session radio', () => {
    expect(draftToBoxPublishArgs(boxDraft(), ctx).p_modules).toEqual([])
    expect(
      draftToBoxPublishArgs(boxDraft(), ctx)
    ).not.toHaveProperty('p_session2_interval_hours')

    const withLoyalty = draftToBoxPublishArgs(
      boxDraft({ loyaltyFollowUp: true, session2IntervalHours: 48 }),
      ctx
    )
    expect(withLoyalty.p_modules).toEqual([MODULE_LOYALTY])
    expect(withLoyalty.p_session2_interval_hours).toBe(48)
  })

  it('sends p_open: false by default and true only for Publish box', () => {
    expect(draftToBoxPublishArgs(boxDraft(), ctx).p_open).toBe(false)
    expect(
      draftToBoxPublishArgs(boxDraft(), { ...ctx, open: false }).p_open
    ).toBe(false)
    expect(
      draftToBoxPublishArgs(boxDraft(), { ...ctx, open: true }).p_open
    ).toBe(true)
  })
})
