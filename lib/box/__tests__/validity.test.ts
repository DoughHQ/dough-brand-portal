import { describe, expect, it } from 'vitest'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '../defaults'
import {
  boxFieldRowErrors,
  evaluateBoxValidity,
  isOpenAudience,
} from '../validity'
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
    focalProductId: 1,
    fieldProducts: [fieldRow(1, '028400017688'), fieldRow(2, '028400017695')],
    physicalUnits: 50,
    ...overrides,
  }
}

describe('evaluateBoxValidity UPC gate', () => {
  it('is ready when every resolved row has a UPC and the field has at least 2', () => {
    expect(evaluateBoxValidity(boxDraft()).readyToPublish).toBe(true)
    expect(evaluateBoxValidity(boxDraft()).fieldOk).toBe(true)
  })

  it('keeps the min-2 field rule even when the lone product has a UPC', () => {
    const v = evaluateBoxValidity(
      boxDraft({
        fieldProducts: [fieldRow(1, '028400017688')],
      })
    )
    expect(v.fieldOk).toBe(false)
    expect(v.outstanding.map((o) => o.message).join(' ')).toMatch(/at least two/i)
  })

  it('blocks publish when a resolved row is missing a UPC', () => {
    const v = evaluateBoxValidity(
      boxDraft({
        fieldProducts: [fieldRow(1, '028400017688'), fieldRow(2, null)],
      })
    )
    expect(v.fieldOk).toBe(false)
    expect(v.readyToPublish).toBe(false)
    expect(v.outstanding.map((o) => o.message).join(' ')).toMatch(/barcode/i)
  })

  it('blocks publish when a resolved row is not yet confirmed', () => {
    const v = evaluateBoxValidity(
      boxDraft({
        fieldProducts: [
          fieldRow(1, '028400017688'),
          fieldRow(2, '028400017695', { identityConfirmed: false }),
        ],
      })
    )
    expect(v.fieldOk).toBe(false)
    expect(v.outstanding.map((o) => o.message).join(' ')).toMatch(/Confirm/i)
  })

  it('blocks publish when two packages share a UPC', () => {
    const v = evaluateBoxValidity(
      boxDraft({
        fieldProducts: [fieldRow(1, '028400017688'), fieldRow(2, '028400017688')],
      })
    )
    expect(v.fieldOk).toBe(false)
    expect(v.outstanding.map((o) => o.message).join(' ')).toMatch(/own UPC/i)
  })
})

describe('loyalty session interval', () => {
  it('blocks publish when loyalty is picked and the interval is under 24h', () => {
    const v = evaluateBoxValidity(
      boxDraft({
        selectedModules: [MODULE_LOYALTY],
        session2IntervalHours: 12,
      })
    )
    expect(v.logisticsOk).toBe(false)
    expect(v.readyToPublish).toBe(false)
    expect(v.outstanding.map((o) => o.message).join(' ')).toMatch(/24 hours/i)
  })
})

describe('isOpenAudience', () => {
  it('treats empty filters plus Anyone as open, not incomplete', () => {
    expect(isOpenAudience(boxDraft())).toBe(true)
    expect(evaluateBoxValidity(boxDraft()).openAudience).toBe(true)
  })

  it('is not open when experience or a rule is set', () => {
    expect(isOpenAudience(boxDraft({ eligibilityTier: 'tried' }))).toBe(false)
    expect(
      isOpenAudience(
        boxDraft({
          eligibility: {
            ...boxDraft().eligibility,
            targetStates: ['CA'],
          },
        })
      )
    ).toBe(false)
  })
})

describe('boxFieldRowErrors', () => {
  it('attaches a missing-UPC error to the row, not only the section', () => {
    const missing = fieldRow(2, null)
    const draft = boxDraft({
      fieldProducts: [fieldRow(1, '028400017688'), missing],
    })
    const errors = boxFieldRowErrors(draft)
    expect(errors[missing.localId]).toMatch(/barcode/i)
    expect(errors[draft.fieldProducts[0]!.localId]).toBeUndefined()
  })

  it('attaches UPC_PRODUCT_MISMATCH to the matching product row', () => {
    const draft = boxDraft()
    const hero = draft.fieldProducts[0]!
    const errors = boxFieldRowErrors(draft, {
      hint: 'UPC_PRODUCT_MISMATCH',
      productId: hero.product_id,
    })
    expect(errors[hero.localId]).toMatch(/doesn't belong/i)
  })
})
