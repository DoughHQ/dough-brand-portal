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
  it('uses the brand package and skips a current-pack benchmark', () => {
    const hero = arm({ localId: 'own', display_name: 'Package A', battle_intent: 'hero' })
    const current = arm({
      localId: 'current',
      display_name: 'Current',
      arm_label: 'B',
      benchmark_role: 'current_pack',
      battle_intent: 'competitor',
    })
    expect(checkoutHero([current, hero])?.localId).toBe('own')
  })

  it('falls back to the first own design', () => {
    const first = arm({ localId: 'a', arm_label: 'A' })
    const second = arm({ localId: 'b', arm_label: 'B' })
    expect(checkoutHero([first, second])?.localId).toBe('a')
  })

  it('labels the hero by its place in the field, not the stored arm name', () => {
    const current = arm({
      localId: 'current',
      arm_label: 'Current pack',
      benchmark_role: 'current_pack',
    })
    const hero = arm({ localId: 'own', arm_label: 'New design', display_name: 'Midnight' })
    expect(checkoutHeroDesignLabel([current, hero])).toBe('Design B')
  })
})
