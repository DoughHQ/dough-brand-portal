import { describe, expect, it } from 'vitest'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '../defaults'
import { draftToBoxPublishArgs } from '../publish'
import {
  MODULE_FIELD_RANKING,
  MODULE_IHUT_CORE_V1,
  MODULE_IHUT_DAY2_V1,
  MODULE_VALUE,
} from '@/lib/study/modules'
import type { BoxFieldRow, BoxStudyDraft } from '../types'

function fieldRow(
  productId: number,
  upc: string | null,
  extra: Partial<BoxFieldRow> = {}
): BoxFieldRow {
  const confirmed = extra.identityConfirmed ?? !!upc
  return {
    ...createEmptyBoxFieldRow(),
    kind: 'product',
    role: 'competitor',
    product_id: productId,
    frozen_display_name: `Product ${productId}`,
    frozen_brand_name: 'Brand',
    upc,
    identityConfirmed: confirmed,
    allergensContains: extra.allergensContains ?? (confirmed ? [] : null),
    allergensMayContain: extra.allergensMayContain ?? (confirmed ? [] : null),
    allergensConfirmed: extra.allergensConfirmed ?? confirmed,
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
      fieldRow(30012404, '028400017688', { role: 'yours' }),
      fieldRow(30012405, '028400017695'),
    ],
    physicalUnits: 50,
    ...overrides,
  }
}

const ctx = { campaignId: 'camp-1', createdBy: 'user-1' }

describe('draftToBoxPublishArgs seats wire', () => {
  it('sends discriminated catalog seats under p_seats for publish_ihut_study_v2', () => {
    const args = draftToBoxPublishArgs(boxDraft(), ctx)
    expect(args.p_seats).toEqual([
      {
        kind: 'product',
        role: 'yours',
        product_id: 30012404,
        upc: '028400017688',
        packaging: 'final_packaging',
        allergens_contains: [],
        allergens_may_contain: [],
      },
      {
        kind: 'product',
        role: 'competitor',
        product_id: 30012405,
        upc: '028400017695',
        packaging: 'final_packaging',
        allergens_contains: [],
        allergens_may_contain: [],
      },
    ])
    expect(args.p_seats[0]).not.toHaveProperty('barcodeOptions')
    expect(args.p_seats[0]).not.toHaveProperty('frozen_display_name')
  })

  it('throws UPC_REQUIRED instead of dropping rows without a barcode', () => {
    const draft = boxDraft({
      fieldProducts: [
        fieldRow(30012404, '028400017688', { role: 'yours' }),
        fieldRow(30012405, null),
      ],
    })
    expect(() => draftToBoxPublishArgs(draft, ctx)).toThrow('UPC_REQUIRED')
  })

  it('throws UPC_REQUIRED when a product has a UPC that is not yet confirmed', () => {
    const draft = boxDraft({
      fieldProducts: [
        fieldRow(30012404, '028400017688', { role: 'yours' }),
        fieldRow(30012405, '028400017695', { identityConfirmed: false }),
      ],
    })
    expect(() => draftToBoxPublishArgs(draft, ctx)).toThrow('UPC_REQUIRED')
  })

  it('throws ALLERGENS_REQUIRED when identity is confirmed but allergens are not', () => {
    const draft = boxDraft({
      fieldProducts: [
        fieldRow(30012404, '028400017688', { role: 'yours' }),
        fieldRow(30012405, '028400017695', {
          allergensConfirmed: false,
          allergensContains: null,
          allergensMayContain: null,
        }),
      ],
    })
    expect(() => draftToBoxPublishArgs(draft, ctx)).toThrow('ALLERGENS_REQUIRED')
  })
})

describe('draftToBoxPublishArgs battle prompt', () => {
  it('always sends an empty battle prompt — Dough locks shelf and taste copy', () => {
    expect(draftToBoxPublishArgs(boxDraft(), ctx).p_battle_prompt).toBe('')
    expect(
      draftToBoxPublishArgs(boxDraft({ battleQuestion: '   ' }), ctx).p_battle_prompt
    ).toBe('')
    expect(
      draftToBoxPublishArgs(
        boxDraft({ battleQuestion: '  Which would you grab for lunch?  ' }),
        ctx
      ).p_battle_prompt
    ).toBe('')
  })

  it('ships method knobs in module_config for the CORE flip', () => {
    const args = draftToBoxPublishArgs(
      boxDraft({
        day2LiveWithIt: true,
        ihutAttributes: ['sweetness', 'texture'],
      }),
      ctx
    )
    expect(args.p_module_config.method_pack).toBe('IHUT_CORE_V1')
    expect(args.p_module_config.attributes).toEqual(['sweetness', 'texture'])
    expect(args.p_module_config.include_day2).toBe(true)
  })
})

describe('draftToBoxPublishArgs CORE modules / p_open', () => {
  it('always sends IHUT_CORE_V1 when CORE publish is on', () => {
    expect(draftToBoxPublishArgs(boxDraft(), ctx).p_modules).toEqual([
      MODULE_IHUT_CORE_V1,
    ])
    expect(draftToBoxPublishArgs(boxDraft(), ctx).p_session2_interval_hours).toBeNull()
  })

  it('sends CORE + Day 2 when Day 2 is on', () => {
    const withDay2 = draftToBoxPublishArgs(
      boxDraft({
        day2LiveWithIt: true,
        session2IntervalHours: 48,
      }),
      ctx
    )
    expect(withDay2.p_modules).toEqual([MODULE_IHUT_CORE_V1, MODULE_IHUT_DAY2_V1])
    expect(withDay2.p_session2_interval_hours).toBe(48)
  })

  it('still honors a legacy loyaltyFollowUp boolean as Day 2', () => {
    const withDay2 = draftToBoxPublishArgs(
      boxDraft({ loyaltyFollowUp: true, session2IntervalHours: 48 }),
      ctx
    )
    expect(withDay2.p_modules).toEqual([MODULE_IHUT_CORE_V1, MODULE_IHUT_DAY2_V1])
    expect(withDay2.p_session2_interval_hours).toBe(48)
  })

  it('drops retired purchase-driver / field-ranking modules', () => {
    const args = draftToBoxPublishArgs(
      boxDraft({
        selectedModules: [MODULE_VALUE, MODULE_FIELD_RANKING],
        session2IntervalHours: 48,
      }),
      ctx
    )
    expect(args.p_modules).toEqual([MODULE_IHUT_CORE_V1])
    expect(args.p_session2_interval_hours).toBeNull()
  })

  it('always publishes open (claim window in the same transaction)', () => {
    expect(draftToBoxPublishArgs(boxDraft(), ctx).p_open).toBe(true)
    expect(
      draftToBoxPublishArgs(boxDraft(), { ...ctx, open: false }).p_open
    ).toBe(true)
    expect(
      draftToBoxPublishArgs(boxDraft(), { ...ctx, open: true }).p_open
    ).toBe(true)
  })
})

describe('draftToBoxPublishArgs V1 audience', () => {
  it('forces open eligibility even when the draft has rules', () => {
    const draft = boxDraft({
      eligibilityTier: 'tried',
      eligibility: {
        ...createEmptyBoxDraft(42).eligibility,
        targetStates: ['CA'],
        minAge: 21,
      },
    })
    const args = draftToBoxPublishArgs(draft, ctx)
    expect(args.p_eligibility_tier).toBe('any')
    expect(args.p_eligibility).toEqual({})
  })
})
