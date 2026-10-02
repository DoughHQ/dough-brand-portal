import { describe, expect, it } from 'vitest'
import { checkoutHero, checkoutHeroDesignLabel } from '../checkoutHero'
import type { ConceptArmRow } from '../types'

function arm(partial: Partial<ConceptArmRow> & Pick<ConceptArmRow, 'localId'>): ConceptArmRow {
  return {
    display_name: '',
    frozen_price: null,
    arm_label: 'A',
    image_url: null,
    image_filename: null,
    stimulus_payload: {},
    ...partial,
  }
}

describe('checkoutHero', () => {
  it('prefers a hero intent over a competitor seat', () => {
    const hero = arm({ localId: 'own', display_name: 'Package A', battle_intent: 'hero' })
    const other = arm({
      localId: 'other',
      display_name: 'Other',
      arm_label: 'B',
      battle_intent: 'competitor',
    })
    expect(checkoutHero([other, hero])?.localId).toBe('own')
  })

  it('falls back to the first design', () => {
    const first = arm({ localId: 'a', arm_label: 'A' })
    const second = arm({ localId: 'b', arm_label: 'B' })
    expect(checkoutHero([first, second])?.localId).toBe('a')
  })

  it('labels the hero by its place in the field, not the stored arm name', () => {
    const first = arm({
      localId: 'first',
      arm_label: 'Stored name',
      battle_intent: 'competitor',
    })
    const hero = arm({ localId: 'own', arm_label: 'New design', display_name: 'Midnight' })
    expect(checkoutHeroDesignLabel([first, hero])).toBe('Design B')
  })
})
