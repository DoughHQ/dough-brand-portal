import { describe, expect, it } from 'vitest'
import { groupDietaryFlags, type DietaryFlagDef } from '../dietaryFlags'

function flag(
  flag_code: string,
  category: string,
  display_order: number
): DietaryFlagDef {
  return { flag_code, label: flag_code, category, display_order }
}

describe('groupDietaryFlags', () => {
  it('puts allergy first and keeps display order inside a group', () => {
    const grouped = groupDietaryFlags([
      flag('vegan', 'diet', 10),
      flag('no_peanuts', 'allergy', 4),
      flag('no_dairy', 'allergy', 2),
      flag('halal', 'religious', 21),
    ])
    expect(grouped.map((g) => g.category)).toEqual(['allergy', 'diet', 'religious'])
    expect(grouped[0]!.heading).toBe('Allergens')
    expect(grouped[0]!.flags.map((f) => f.flag_code)).toEqual([
      'no_dairy',
      'no_peanuts',
    ])
  })

  it('appends unknown categories after the known order', () => {
    const grouped = groupDietaryFlags([
      flag('vegan', 'diet', 1),
      flag('custom', 'custom_cat', 1),
    ])
    expect(grouped.map((g) => g.category)).toEqual(['diet', 'custom_cat'])
    expect(grouped[1]!.heading).toBe('Custom Cat')
  })
})
