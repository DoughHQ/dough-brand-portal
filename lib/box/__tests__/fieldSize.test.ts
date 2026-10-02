import { describe, expect, it } from 'vitest'
import {
  MAX_BOX_FIELD_SIZE,
  canAddBoxProduct,
  getBoxFieldOverBy,
  getBoxRemainingSlots,
} from '../fieldSize'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '../defaults'
import type { BoxStudyDraft } from '../types'

function draftWith(n: number): BoxStudyDraft {
  const d = createEmptyBoxDraft()
  return {
    ...d,
    fieldProducts: Array.from({ length: n }, (_, i) => ({
      ...createEmptyBoxFieldRow(),
      product_id: 100 + i,
      frozen_display_name: `P${i}`,
      frozen_brand_name: 'B',
      upc: `02840000${1000 + i}`,
      identityConfirmed: true,
    })),
  }
}

describe('box field size', () => {
  it('caps the field at 5', () => {
    expect(MAX_BOX_FIELD_SIZE).toBe(5)
    expect(getBoxRemainingSlots(draftWith(3))).toBe(2)
    expect(canAddBoxProduct(draftWith(4))).toBe(true)
    expect(canAddBoxProduct(draftWith(5))).toBe(false)
    expect(getBoxFieldOverBy(draftWith(6))).toBe(1)
  })
})
