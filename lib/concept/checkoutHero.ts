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
