import type { ConceptStudyDraft, PricePosture } from './types'
import { isPriced } from './price'
import { CONCEPT_PUBLISH_HINT_MESSAGES } from './errors'

export type FieldValidity = {
  competitorCount: number
  conceptArmCount: number
  pairings: number
  priceOk: boolean
  priceMessage: string
  intentsOk: boolean
  fieldOk: boolean
  reasons: string[]
}

/** Pairings per respondent = C(n,2) capped at scoring_rounds. */
export function pairingsPerRespondent(n: number, scoringRounds: number): number {
  if (n < 2) return 0
  const combinatorial = (n * (n - 1)) / 2
  return Math.min(combinatorial, Math.max(1, scoringRounds))
}

export function evaluateFieldValidity(draft: ConceptStudyDraft): FieldValidity {
  const arms = draft.conceptArms
  const products = draft.products
  const total = arms.length + products.length
  const reasons: string[] = []

  if (total < 2) reasons.push('A study needs at least two competitors.')
  if (arms.length < 1) reasons.push('Add at least one of your own concept arms.')

  const prices = [
    ...arms.map((a) => a.frozen_price),
    ...products.map((p) => p.frozen_price),
  ]
  const pricedCount = prices.filter(isPriced).length
  const allPriced = total > 0 && pricedCount === total
  const allUnpriced = pricedCount === 0
  let priceOk = true
  let priceMessage = '—'

  if (draft.pricePosture === 'blind') {
    priceOk = allUnpriced
    priceMessage = allUnpriced
      ? '✓ blind · no prices'
      : `✗ ${pricedCount} competitor${pricedCount === 1 ? '' : 's'} still priced`
    if (!priceOk) reasons.push('Blind posture requires no prices on any competitor.')
  } else if (draft.pricePosture === 'realistic') {
    priceOk = allPriced
    priceMessage = allPriced
      ? '✓ all priced'
      : `✗ ${total - pricedCount} competitor${total - pricedCount === 1 ? '' : 's'} need a price`
    if (!priceOk) reasons.push('Realistic posture requires every competitor to be priced.')
  } else {
    // variable — still require symmetry (all or none) per publish invariant
    priceOk = allPriced || allUnpriced
    priceMessage = priceOk
      ? allPriced
        ? '✓ all priced'
        : '✓ none priced'
      : `✗ ${total - pricedCount} competitor${total - pricedCount === 1 ? '' : 's'} need a price`
    if (!priceOk) {
      reasons.push(
        CONCEPT_PUBLISH_HINT_MESSAGES.PRICE_ASYMMETRY ??
          'Every competitor must be priced the same way — all priced, or none.'
      )
    }
  }

  const armIntentsOk = arms.every((a) => !!a.battle_intent && a.display_name.trim())
  const productIntentsOk = products.every(
    (p) => !!p.battle_intent && p.product_id != null && p.frozen_display_name.trim()
  )
  const intentsOk = armIntentsOk && productIntentsOk
  if (!intentsOk) {
    reasons.push('Every competitor needs a name and a role.')
  }

  const fieldOk =
    total >= 2 && arms.length >= 1 && priceOk && intentsOk && draft.title.trim().length > 0

  if (!draft.title.trim()) reasons.push('Give the study a title.')

  return {
    competitorCount: total,
    conceptArmCount: arms.length,
    pairings: pairingsPerRespondent(total, draft.scoringRounds),
    priceOk,
    priceMessage,
    intentsOk,
    fieldOk,
    reasons,
  }
}

export function pricePostureHelp(posture: PricePosture): string {
  if (posture === 'blind') return 'No prices shown — pure preference without a buy signal.'
  if (posture === 'variable') {
    return 'Prices may differ — tests willingness across price points.'
  }
  return 'Every competitor priced · closest to a real buy signal.'
}
