import type {
  ConceptPublishConcept,
  ConceptPublishProduct,
  ConceptPublishQuestion,
  ConceptStudyDraft,
} from './types'
import { defaultFloor, armLabelForIndex } from './defaults'
import { formatPriceLabel, priceToWire } from './price'

/** Combinatorial pairs for a field of size n. */
export function uniquePairs(n: number): number {
  if (n < 2) return 0
  return (n * (n - 1)) / 2
}

/** Default scoring rounds: min(10, pairs). */
export function defaultScoringRounds(fieldSize: number): number {
  const pairs = uniquePairs(fieldSize)
  if (pairs < 1) return 1
  return Math.min(10, pairs)
}

/**
 * Map UI draft → wire payloads for publish_concept_study.
 * For template modes (package / price), questions are omitted — caller sends null.
 * Hand-built questions plumbing stays for non-template escape hatch.
 */
export function draftToPublishPayload(draft: ConceptStudyDraft): {
  concepts: ConceptPublishConcept[]
  products: ConceptPublishProduct[]
  questions: ConceptPublishQuestion[] | null
} {
  const useTemplate =
    draft.stimulusMode === 'package' || draft.stimulusMode === 'price'

  const concepts: ConceptPublishConcept[] = draft.conceptArms.map((arm, i) => {
    const base: ConceptPublishConcept = {
      arm_label: arm.arm_label || armLabelForIndex(i),
      display_name: arm.display_name.trim(),
      image_url: arm.image_url?.trim() || null,
      frozen_price: priceToWire(arm.frozen_price),
      stimulus_payload: arm.stimulus_payload ?? {},
    }
    if (!useTemplate && draft.stimulusMode) {
      base.stimulus_type = draft.stimulusMode
    }
    return base
  })

  const products: ConceptPublishProduct[] = draft.products
    .filter((p) => p.product_id != null)
    .map((p) => ({
      product_id: p.product_id as number,
      frozen_display_name: p.frozen_display_name.trim(),
      frozen_brand_name: p.frozen_brand_name.trim(),
      frozen_image_url: p.frozen_image_url,
      frozen_price: priceToWire(p.frozen_price),
      market_reference_price: priceToWire(p.market_reference_price),
      battle_intent: p.battle_intent,
    }))

  if (useTemplate) {
    return { concepts, products, questions: null }
  }

  const questions: ConceptPublishQuestion[] = []
  let pos = 0

  for (const s of draft.screeners) {
    pos += 1
    questions.push({
      question_type_code: 'concept_screener',
      session_number: 1,
      position: pos,
      label: s.label || `screener_${pos}`,
      config: s.config,
      is_required: s.is_required,
      drives_rounds: false,
    })
  }

  pos += 1
  questions.push({
    question_type_code: 'concept_battle',
    session_number: 1,
    position: pos,
    label: 'battles',
    config: {
      prompt: 'Which do you prefer?',
      options: ['A wins', 'B wins', 'neither', 'skip'],
      min_select: 1,
      max_select: 1,
    },
    is_required: true,
    drives_rounds: true,
  })

  for (const d of draft.diagnostics) {
    pos += 1
    questions.push({
      question_type_code: 'concept_diagnostic',
      session_number: 1,
      position: pos,
      label: d.label || `diagnostic_${pos}`,
      config: d.config,
      is_required: d.is_required,
      drives_rounds: false,
    })
  }

  const leaderPriceLabel = formatPriceLabel(draft.conceptArms[0]?.frozen_price)
  const floor =
    draft.floor ??
    defaultFloor(draft.conceptArms[0]?.display_name || 'this', leaderPriceLabel)
  pos += 1
  questions.push({
    question_type_code: 'concept_floor',
    session_number: 1,
    position: pos,
    label: floor.label || 'purchase_intent',
    config: floor.config,
    is_required: true,
    drives_rounds: false,
  })

  if (draft.sessionCount === 2) {
    questions.push({
      question_type_code: 'concept_battle',
      session_number: 2,
      position: 1,
      label: 'drift_battles',
      config: {
        prompt: 'Which do you prefer now?',
        options: ['A wins', 'B wins', 'neither', 'skip'],
        min_select: 1,
        max_select: 1,
      },
      is_required: true,
      drives_rounds: true,
    })
  }

  return { concepts, products, questions }
}
