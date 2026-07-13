/** Frozen concept-mission report — portal is a pure renderer of this shape. */

export type BattleIntent = 'own_concept_arm' | 'direct_competitor' | 'jtbd_incumbent'

export type CombatantKind = 'concept' | 'product' | string

export type RelationshipToField =
  | 'concept_leads_field'
  | 'concept_ahead_of_some_products'
  | 'products_lead_concepts'
  | string

export type DecisionPosture =
  | 'early_read'
  | 'tie_break_needed'
  | 'concept_ahead'
  | 'mixed'
  | 'products_lead'
  | string

export type HeadlineKind = 'confident' | 'provisional'

export type WinRateFieldRow = {
  combatant_ref: number
  display_name: string
  battle_intent: BattleIntent | string
  kind: CombatantKind
  rank: number
  placeable: boolean
  win_rate_of_100: number | null
  win_rate_lo: number | null
  win_rate_hi: number | null
  frozen_price?: number | string | null
  image_url?: string | null
}

export type FindingCombatant = {
  combatant_ref?: number
  display_name: string
  kind?: CombatantKind
  battle_intent?: BattleIntent | string
  win_rate_of_100?: number | null
}

/** Server next-step core — render action + rationale; headline_kind gates verdict tone. */
export type DecisionFrame = {
  posture: DecisionPosture
  action: string
  rationale: string
  headline_kind: HeadlineKind
}

export type Finding = {
  top: FindingCombatant
  relationship_to_field: RelationshipToField
  is_tie: boolean
  tie_with: FindingCombatant | null
  is_thin: boolean
  suggested_additional_respondents: number | null
  note: string
  /** Nested on finding in production; also accepted at report root for older shapes. */
  decision_frame: DecisionFrame | null
}

export type PairMatchup = {
  opponent_ref: number
  opponent_name: string
  opponent_kind: CombatantKind | null
  opponent_intent: BattleIntent | string | null
  top_wins: number
  opponent_wins: number
  shown: number
}

export type TopPairRecord = {
  display_name: string
  kind: CombatantKind | null
  battle_intent: BattleIntent | string | null
  combatant_ref: number | null
  vs: PairMatchup[]
}

export type PositionBiasCheck = {
  shown_first_win_rate: number | null
  gap_from_0_5?: number | null
  note?: string | null
}

export type PairCoverage = {
  mean_shown: number | null
  min_shown: number | null
  max_shown: number | null
  note?: string | null
}

export type Connectivity = {
  fully_connected: boolean
  n_components?: number | null
  note?: string | null
}

export type DesignEffectSummary = {
  mean_design_effect: number | null
  n_clusters?: number | null
  interpretation?: string | null
}

export type SignalKind =
  | 'categorical_distribution'
  | 'intent_scale'
  | 'screening_context'
  | 'ordinal_rating'
  | 'free_text'
  | string

export type QuestionAggregate = {
  n_answers: number | null
  distribution: Record<string, number>
  shares: Record<string, number>
  framing?: string | null
  presentation_rule?: string | null
}

export type QuestionResponse = {
  question_type_code: string
  display_name: string | null
  prompt: string
  session_number: number | null
  position: number | null
  signal_kind: SignalKind
  framing_note: string | null
  aggregate: QuestionAggregate
}

export type ConceptMissionReport = {
  id: string
  mission_id: string
  study_title: string | null
  category_label: string | null
  price_posture_label: string | null
  prices_shown: boolean
  report_maturity: 'preliminary' | 'final' | string | null
  snapshot_date: string | null
  computed_at: string
  is_current: boolean
  n_concepts: number
  n_products: number
  n_respondents: number
  n_decisive_battles: number
  n_neither: number | null
  neither_rate: number | null
  n_combatants: number
  win_rate_field: WinRateFieldRow[]
  finding: Finding
  /** Resolved from finding.decision_frame or root; never invent judgment. */
  decision_frame: DecisionFrame
  top_pair_record: TopPairRecord | null
  question_responses: QuestionResponse[]
  position_bias_check: PositionBiasCheck | null
  achieved_pair_coverage: PairCoverage | null
  connectivity: Connectivity | null
  design_effect_summary: DesignEffectSummary | null
  min_cluster_warning: string
  is_simulated: boolean
}

export type ConceptReportErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_A_PORTAL_USER'
  | 'NO_REPORT_YET'
  | 'FORBIDDEN'
  | 'FETCH_ERROR'

export type ConceptReportLoadResult =
  | { ok: true; report: ConceptMissionReport }
  | { ok: false; code: ConceptReportErrorCode; detail?: string }
