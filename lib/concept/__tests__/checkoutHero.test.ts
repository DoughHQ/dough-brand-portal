import { describe, expect, it } from 'vitest'
import { checkoutHero } from '../checkoutHero'
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
})
