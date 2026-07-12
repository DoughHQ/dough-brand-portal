/** Concept study — operator console types (UI ↔ publish_concept_mission wire). */

export type StimulusType =
  | 'name'
  | 'package'
  | 'claim'
  | 'flavor'
  | 'positioning'
  | 'price'
  | 'full_concept'

export type BattleIntent = 'own_concept_arm' | 'direct_competitor' | 'jtbd_incumbent'

export type PricePosture = 'blind' | 'realistic' | 'variable'

/** UI row — concept arm (private). Wire → p_concepts[]. */
export type ConceptArmRow = {
  localId: string
  display_name: string
  stimulus_type: StimulusType
  /** Raw operator input — "" / "4.99". Blank = null on wire. */
  frozen_price: string | null
  battle_intent: BattleIntent
  arm_label: string
  image_url: string | null
  stimulus_payload: Record<string, unknown>
}

/** UI row — real-product competitor. Wire → p_products[]. */
export type ProductCompetitorRow = {
  localId: string
  product_id: number | null
  frozen_display_name: string
  frozen_brand_name: string
  frozen_image_url: string | null
  /** Raw operator input — "" / "4.99". Blank = null on wire. */
  frozen_price: string | null
  battle_intent: BattleIntent
}

export type ConceptQuestionCode =
  | 'concept_screener'
  | 'concept_battle'
  | 'concept_diagnostic'
  | 'concept_floor'

export type QuestionConfig = {
  prompt: string
  options: string[]
  min_select?: number
  max_select?: number
  qualify_rule?: { op: string; value: string | number | string[] } | null
}

export type ConceptQuestionSlot = {
  localId: string
  question_type_code: ConceptQuestionCode
  session_number: 1 | 2
  position: number
  label: string
  config: QuestionConfig
  is_required: boolean
  drives_rounds: boolean
}

export type ConceptStudyDraft = {
  draftId: string
  title: string
  brandId: number
  brandCampaignId: string | null
  taxonomyNodeId: number
  pricePosture: PricePosture
  sessionCount: 1 | 2
  session2IntervalHours: number
  scoringRounds: number
  conceptArms: ConceptArmRow[]
  products: ProductCompetitorRow[]
  screeners: ConceptQuestionSlot[]
  diagnostics: ConceptQuestionSlot[]
  floor: ConceptQuestionSlot | null
  audienceDefinition: string
  predictiveValidityOptIn: boolean
  categoryIntelligenceOptIn: boolean
  updatedAt: string
  /** Source draft id if duplicated */
  duplicatedFrom?: string | null
}

export type ConceptPublishConcept = {
  arm_label: string
  stimulus_type: StimulusType
  stimulus_payload: Record<string, unknown>
  display_name: string
  image_url: string | null
  /** String "4.99" — RPC casts numeric. null = unpriced. */
  frozen_price: string | null
  battle_intent: BattleIntent
}

export type ConceptPublishProduct = {
  product_id: number
  frozen_display_name: string
  frozen_brand_name: string
  frozen_image_url: string | null
  /** String "4.99" — RPC casts numeric. null = unpriced. */
  frozen_price: string | null
  battle_intent: BattleIntent
}

export type ConceptPublishQuestion = {
  question_type_code: ConceptQuestionCode
  session_number: number
  position: number
  label: string
  config: QuestionConfig
  is_required: boolean
  drives_rounds: boolean
}
