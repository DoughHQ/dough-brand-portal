import type { ConceptStudyDraft } from '@/lib/concept/types'
import type { ConceptPlanCombatant, PresentedPosition } from './planTypes'

export type PreviewCombatant = ConceptPlanCombatant

function priceToNumber(raw: string | null | undefined): number | null {
  if (raw == null || !String(raw).trim()) return null
  const n = Number(String(raw).replace(/[^0-9.]+/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Concepts first, then products, refs starting at 1. */
export function combatantsFromDraft(draft: ConceptStudyDraft): PreviewCombatant[] {
  const out: PreviewCombatant[] = []
  let ref = 1
  for (const arm of draft.conceptArms) {
    out.push({
      ref,
      kind: 'concept',
      name: arm.display_name.trim() || arm.arm_label || `Concept ${ref}`,
      brand: null,
      image_url: arm.image_url,
      price: priceToNumber(arm.frozen_price),
    })
    ref += 1
  }
  for (const product of draft.products) {
    out.push({
      ref,
      kind: 'product',
      name: product.frozen_display_name.trim() || `Competitor ${ref}`,
      brand: product.frozen_brand_name.trim() || null,
      image_url: product.frozen_image_url,
      price: priceToNumber(product.frozen_price),
    })
    ref += 1
  }
  return out
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type BattlePair = {
  round_number: number
  combatant_ref_a: number
  combatant_ref_b: number
  presented_position: PresentedPosition
}

/** All unique pairs, shuffled + L/R assigned from draft seed. */
export function representativePairs(
  refs: number[],
  seed: string
): BattlePair[] {
  const raw: Array<[number, number]> = []
  for (let i = 0; i < refs.length; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      raw.push([refs[i]!, refs[j]!])
    }
  }
  const rng = mulberry32(hashSeed(seed))
  for (let i = raw.length - 1; i > 0; i--) {
    const k = Math.floor(rng() * (i + 1))
    const tmp = raw[i]!
    raw[i] = raw[k]!
    raw[k] = tmp
  }
  return raw.map(([a, b], idx) => ({
    round_number: idx + 1,
    combatant_ref_a: a,
    combatant_ref_b: b,
    presented_position: rng() < 0.5 ? 'a_left' : 'b_left',
  }))
}

export function withDisplayPrices(
  combatants: PreviewCombatant[],
  hidePrice: boolean
): PreviewCombatant[] {
  if (!hidePrice) return combatants
  return combatants.map((c) => ({ ...c, price: null }))
}
