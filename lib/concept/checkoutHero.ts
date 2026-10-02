import { respondentDesignLabel } from './designLetters'
import type { ConceptArmRow } from './types'

/**
 * The brand's own package for the checkout handoff.
 * Every concept is equal in the field — first non-competitor intent, else first arm.
 */
export function checkoutHero(arms: ConceptArmRow[]): ConceptArmRow | null {
  return arms.find((arm) => arm.battle_intent !== 'competitor') ?? arms[0] ?? null
}

/** The letter shoppers see for that package, by its place in the field. */
export function checkoutHeroDesignLabel(arms: ConceptArmRow[]): string | null {
  const hero = checkoutHero(arms)
  if (!hero) return null
  const index = arms.indexOf(hero)
  return index >= 0 ? respondentDesignLabel(index) : null
}
