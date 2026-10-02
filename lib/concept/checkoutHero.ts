import { respondentDesignLabel } from './designLetters'
import type { ConceptArmRow } from './types'

/**
 * The brand's own package for the checkout handoff.
 * A current-pack benchmark is a competitor seat, so it is not the hero.
 */
export function checkoutHero(arms: ConceptArmRow[]): ConceptArmRow | null {
  const own = arms.filter((arm) => arm.benchmark_role !== 'current_pack')
  const pool = own.length > 0 ? own : arms
  return pool.find((arm) => arm.battle_intent !== 'competitor') ?? pool[0] ?? null
}

/** The letter shoppers see for that package, by its place in the field. */
export function checkoutHeroDesignLabel(arms: ConceptArmRow[]): string | null {
  const hero = checkoutHero(arms)
  if (!hero) return null
  const index = arms.indexOf(hero)
  return index >= 0 ? respondentDesignLabel(index) : null
}
