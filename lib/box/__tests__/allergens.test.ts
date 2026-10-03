import { describe, expect, it } from 'vitest'
import {
  allergenSeatsForCount,
  isAllergenConfirmed,
  parseAllergenPrefill,
} from '../allergens'

describe('box allergens helpers', () => {
  it('treats empty arrays as a confirmed declaration of none', () => {
    expect(
      isAllergenConfirmed({
        allergensConfirmed: true,
        allergensContains: [],
        allergensMayContain: [],
      })
    ).toBe(true)
  })

  it('builds count seats only from confirmed rows', () => {
    expect(
      allergenSeatsForCount([
        {
          product_id: 1,
          allergensConfirmed: true,
          allergensContains: ['milk'],
          allergensMayContain: [],
        },
        { product_id: 2, allergensConfirmed: false, allergensContains: [], allergensMayContain: [] },
      ])
    ).toEqual([{ contains: ['milk'], may_contain: [] }])
  })

  it('parses prefill payloads', () => {
    expect(
      parseAllergenPrefill({
        status: 'confident',
        contains: ['wheat'],
        may_contain: ['milk'],
        needs_label_confirm: false,
      })
    ).toEqual({
      status: 'confident',
      contains: ['wheat'],
      may_contain: ['milk'],
      needs_label_confirm: false,
    })
  })
})
