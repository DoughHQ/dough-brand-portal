import type { ConceptBattleOutcome } from './planTypes'

/** Implied winner ref from outcome. A_WIN → A, B_WIN → B, else null. */
export function winnerRefForOutcome(
  outcome: ConceptBattleOutcome,
  combatantRefA: number,
  combatantRefB: number
): number | null {
  if (outcome === 'A_WIN') return combatantRefA
  if (outcome === 'B_WIN') return combatantRefB
  return null
}

export type SessionWinTally = Map<number, number>

export function emptyWinTally(): SessionWinTally {
  return new Map()
}

export function applyBattleWin(
  tally: SessionWinTally,
  outcome: ConceptBattleOutcome,
  combatantRefA: number,
  combatantRefB: number
): SessionWinTally {
  const winner = winnerRefForOutcome(outcome, combatantRefA, combatantRefB)
  if (winner == null) return tally
  const next = new Map(tally)
  next.set(winner, (next.get(winner) ?? 0) + 1)
  return next
}

/** Most A_WIN/B_WIN refs. Ties break toward the lower ref. Empty → null. */
export function mostChosenCombatantRef(tally: SessionWinTally): number | null {
  if (tally.size === 0) return null
  let bestRef: number | null = null
  let bestCount = -1
  for (const [ref, count] of tally) {
    if (
      count > bestCount ||
      (count === bestCount && bestRef != null && ref < bestRef) ||
      (count === bestCount && bestRef == null)
    ) {
      bestCount = count
      bestRef = ref
    }
  }
  return bestRef
}

export function outcomeForCardTap(
  side: 'left' | 'right',
  presentedPosition: 'a_left' | 'b_left'
): 'A_WIN' | 'B_WIN' {
  if (presentedPosition === 'a_left') {
    return side === 'left' ? 'A_WIN' : 'B_WIN'
  }
  return side === 'left' ? 'B_WIN' : 'A_WIN'
}

export function layoutCombatantRefs(
  presentedPosition: 'a_left' | 'b_left',
  combatantRefA: number,
  combatantRefB: number
): { leftRef: number; rightRef: number } {
  if (presentedPosition === 'a_left') {
    return { leftRef: combatantRefA, rightRef: combatantRefB }
  }
  return { leftRef: combatantRefB, rightRef: combatantRefA }
}
