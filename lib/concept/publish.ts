import type {
  ConceptPublishConcept,
  ConceptPublishProduct,
  ConceptPublishQuestion,
  ConceptStudyDraft,
} from './types'
import { defaultFloor } from './defaults'
import { formatPriceLabel, priceToWire } from './price'

/** Map UI draft → wire payloads for publish_concept_mission. */
export function draftToPublishPayload(draft: ConceptStudyDraft): {
  concepts: ConceptPublishConcept[]
  products: ConceptPublishProduct[]
  questions: ConceptPublishQuestion[]
} {
  const concepts: ConceptPublishConcept[] = draft.conceptArms.map((arm, i) => ({
    arm_label: arm.arm_label || `arm_${i + 1}`,
    stimulus_type: arm.stimulus_type,
    stimulus_payload: arm.stimulus_payload ?? {},
    display_name: arm.display_name.trim(),
    image_url: arm.image_url,
    frozen_price: priceToWire(arm.frozen_price),
    battle_intent: arm.battle_intent,
  }))

  const products: ConceptPublishProduct[] = draft.products
    .filter((p) => p.product_id != null)
    .map((p) => ({
      product_id: p.product_id as number,
      frozen_display_name: p.frozen_display_name.trim(),
      frozen_brand_name: p.frozen_brand_name.trim(),
      frozen_image_url: p.frozen_image_url,
      frozen_price: priceToWire(p.frozen_price),
      battle_intent: p.battle_intent,
    }))

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
