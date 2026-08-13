/** Concept study — operator console types (UI ↔ publish_concept_study wire). */

export type StimulusMode =
  | 'name'
  | 'package'
  | 'claim'
  | 'flavor'
  | 'positioning'
  | 'price'
  | 'full_concept'

/** @deprecated Prefer StimulusMode at study level. Kept for non-package escape hatch. */
export type StimulusType = StimulusMode

export type BattleIntent = 'own_concept_arm' | 'direct_competitor' | 'jtbd_incumbent'

export type PricePosture = 'blind' | 'realistic' | 'variable'

export type PriceAnswerMode = 'bands' | 'exact'

/** Stable sentinel option ids — never entity-backed. Runner + report match on these. */
export type SentinelId = 'decoy' | 'none_of_these' | 'not_sure'

/** Verification answer option — a real brand (brand-grain) the respondent may have bought, or a sentinel. */
export type VerificationOption =
  | { id: `brand:${number}`; label: string; brand_id: number }
  | { id: 'decoy' | 'none_of_these'; label: string }

/** Legibility answer option — a taxonomy category (plausible confusion), or the not-sure sentinel. */
export type LegibilityOption =
  | { id: `tax:${number}`; label: string; taxonomy_node_id: number }
  | { id: 'not_sure'; label: string }

/**
 * Packaging template config — keys match S1_CONCEPT_PACKAGING tokens.
 * Options are ID-shaped: labels are display-only; the id is authoritative wire identity
 * (resolved & frozen server-side at publish). Price bands are generated at publish from
 * expected_price — the operator never authors bands.
 */
export type PackagingTemplateConfig = {
  category_plural: string
  pack_size: string
  /** Shelf price shown in respondent copy. Free text formatted for display ("$4.99"). */
  price_display: string
  /** Fake brand NAME (display only). Becomes the {id:'decoy'} sentinel's label at compose time. */
  decoy_option: string
  verification_options: VerificationOption[]
  legibility_options: LegibilityOption[]
  /**
   * Operator's expected retail price — RAW number string ("8.99"), no currency symbol.
   * The anchor bands are generated around at publish. "" until set.
   */
  expected_price: string
  /** Dormant: bands-only for packaging. 'exact' stays disabled until a later mode ships. */
  price_answer_mode: PriceAnswerMode
}

/** UI row — concept arm (private). Wire → p_concepts[]. */
export type ConceptArmRow = {
  localId: string
  display_name: string
  /** Raw operator input — "" / "4.99". Blank = null on wire. */
  frozen_price: string | null
  arm_label: string
  /**
   * Stimulus image ref — bucket-prefixed path (`concept-stimuli/...`) or legacy https URL.
   * Never a signed URL.
   */
  image_url: string | null
  /** Draft-only display name for the uploader filled state. */
  image_filename: string | null
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
  /**
   * What this competitor actually sells for. Raw operator input — "" / "4.99".
   * Used only to derive the WTP band range from the real shelf instead of the
   * operator's expected price. Never shown to respondents, and never the same
   * thing as frozen_price (which drives the blind price-symmetry guard).
   */
  market_reference_price: string | null
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
  /** null until an L3 category is explicitly chosen in Section 0. */
  taxonomyNodeId: number | null
  /** Study-level stimulus mode. null until Section 0 is answered. */
  stimulusMode: StimulusMode | null
  templateConfig: PackagingTemplateConfig
  pricePosture: PricePosture
  /** Packaging is S1-only; kept for non-package escape hatch. */
  sessionCount: 1 | 2
  session2IntervalHours: number
  scoringRounds: number
  /** Closes the study when hit. Required in practice. */
  targetCompletions: number
  /** ISO timestamp — missions.expires_at is NOT NULL. */
  expiresAt: string
  conceptArms: ConceptArmRow[]
  products: ProductCompetitorRow[]
  /** Hand-built questions — escape hatch for non-package modes. Unused for package. */
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

/** Wire shape for own concept arms under publish_concept_study. */
export type ConceptPublishConcept = {
  arm_label: string
  display_name: string
  image_url: string | null
  /** String "4.99" — RPC casts numeric. null = unpriced. */
  frozen_price: string | null
  stimulus_payload: Record<string, unknown>
  /** Only for non-package escape hatch when p_questions is sent. */
  stimulus_type?: StimulusMode
}

export type ConceptPublishProduct = {
  product_id: number
  frozen_display_name: string
  frozen_brand_name: string
  frozen_image_url: string | null
  /** String "4.99" — RPC casts numeric. null = unpriced. */
  frozen_price: string | null
  /** String "4.99" — real shelf price, drives the WTP band range. null = unknown. */
  market_reference_price: string | null
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

export type ConceptPublishSuccessMeta = {
  missionId: string
  campaignId: string
  field_size: number | null
  unique_pairs: number | null
  rounds_per_respondent: number | null
  coverage_note: string | null
  target_completions: number | null
  template_code: string | null
}
