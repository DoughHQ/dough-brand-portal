import { md5Hex } from './md5'
import {
  mostChosenCombatantRef,
  type SessionWinTally,
} from './sessionWins'
import type { ConceptPlanSubject } from './planTypes'

/**
 * Seeded pick among concept-arm refs only.
 *
 * Live `start_concept_session` assigns `diagnostic_focal_ref` as:
 *   v_concept_refs[ abs(hashtextextended(claim_id || ':focal', 0)) % n + 1 ]
 *
 * Preview has no claim id and cannot port `hashtextextended`. Same `:focal`
 * suffix over the draft seed, hashed with MD5 (same family as why-round
 * sampling). Deterministic. Never a product.
 */
export function pickAssignedConceptRef(
  conceptRefs: readonly number[],
  seed: string
): number | null {
  const refs = [...conceptRefs]
    .filter((r) => Number.isFinite(r))
    .sort((a, b) => a - b)
  const n = refs.length
  if (n === 0) return null
  const hex = md5Hex(`${seed}:focal`).slice(0, 8)
  const hashed = Number.parseInt(hex, 16)
  if (!Number.isFinite(hashed)) return refs[0] ?? null
  return refs[hashed % n] ?? null
}

export type FocalScreenInput = {
  resolve_subject?: string | null
  focal_arm?: string | null
  subject?: ConceptPlanSubject | null
  subject_ref?: number | null
}

/**
 * Subject for a single-focal diagnostic / floor / probe.
 *
 * - `assigned`: baked concept arm (seeded at plan time). Independent of battles.
 * - `respondent_winner` / `client_session_winner`: most-chosen across the
 *   FULL field — a product that wins battles is the subject, matching Expo
 *   and `record_concept_screen_response`. Empty tally → null (no fabrication).
 */
export function resolveFocalSubject(args: {
  screen: FocalScreenInput
  tally: SessionWinTally
  byRef: ReadonlyMap<number, ConceptPlanSubject>
  conceptRefs?: readonly number[]
  seed?: string
}): ConceptPlanSubject | null {
  const resolve = (args.screen.resolve_subject ?? '').trim()
  if (resolve === 'client_session_winner') {
    const ref = mostChosenCombatantRef(args.tally)
    if (ref == null) return null
    return args.byRef.get(ref) ?? { ref, name: `Option ${ref}` }
  }

  if (args.screen.subject && typeof args.screen.subject.ref === 'number') {
    return args.screen.subject
  }

  if (
    args.screen.subject_ref != null &&
    Number.isFinite(args.screen.subject_ref)
  ) {
    return (
      args.byRef.get(args.screen.subject_ref) ?? {
        ref: args.screen.subject_ref,
        name: `Option ${args.screen.subject_ref}`,
      }
    )
  }

  if (
    args.screen.focal_arm === 'assigned' &&
    args.conceptRefs &&
    args.seed != null
  ) {
    const ref = pickAssignedConceptRef(args.conceptRefs, args.seed)
    if (ref == null) return null
    return args.byRef.get(ref) ?? { ref, name: `Option ${ref}` }
  }

  return null
}

export function subjectIndexFromCombatants(
  combatants: ReadonlyArray<{
    ref: number
    kind: string
    name: string
    brand: string | null
    image_url: string | null
    image_unavailable?: boolean
    price: number | null
  }>
): Map<number, ConceptPlanSubject> {
  const map = new Map<number, ConceptPlanSubject>()
  for (const c of combatants) {
    map.set(c.ref, {
      ref: c.ref,
      kind: c.kind,
      name: c.name,
      brand: c.brand,
      image_url: c.image_url,
      image_unavailable: c.image_unavailable,
      price: c.price,
    })
  }
  return map
}
