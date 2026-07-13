/** Frozen experienced-mission report — pure renderer of get_experienced_mission_report. */

export type ReportableMetric = {
  value: number | null
  ci_low: number | null
  ci_high: number | null
  reportable: boolean
  withheld_reason: string | null
  n_users?: number | null
  n_decisive?: number | null
  n_answers?: number | null
  n_wins?: number | null
  n_ties?: number | null
  n_positive?: number | null
  n_citing?: number | null
}

export type ExperienceSplit =
  | 'experienced_vs_experienced'
  | 'experienced_vs_hypothetical'
  | string

export type HeadlineWinRateRow = ReportableMetric & {
  method?: string | null
  experience_split: ExperienceSplit
}

export type FocalProduct = {
  product_id: number | null
  name: string
  brand: string | null
}

export type Participation = {
  n_users: number
  n_claims: number
  n_sessions: number
}

export type ReportStage = {
  stage: 'preliminary' | 'final' | string
  is_final: boolean
  mission_status?: string | null
  target_completions?: number | null
  completions_delivered?: number | null
  stage_semantics?: string | null
}

export type Reliability = ReportableMetric & {
  consistency_rate: number | null
  n_consistent?: number | null
  n_inconsistent?: number | null
  n_users_with_repeats?: number | null
  scope_note?: string | null
}

export type EvidenceGradeRow = ReportableMetric & {
  evidence_split?: string | null
  experience_split?: string | null
}

export type EvidenceComposition = {
  by_grade: EvidenceGradeRow[]
  grade_semantics: Record<string, string>
  frozen_at?: string | null
  receipt_note?: string | null
  ungraded_events?: number | null
}

export type OpponentRow = ReportableMetric & {
  opponent_product_id: number | null
  opponent_name: string
  opponent_brand: string | null
  experience_split?: ExperienceSplit | null
}

export type DriverRow = ReportableMetric & {
  driver: string
  share: number | null
}

export type ChoiceDrivers = {
  by_outcome: {
    focal_won: DriverRow[]
    focal_lost: DriverRow[]
  }
  interpretation?: string | null
  timing_note?: string | null
  presentation_control?: string | null
}

export type RankPairClass = ReportableMetric & {
  pair_class: 'battled' | 'inferred' | string
  agreement_rate: number | null
  n_agree?: number | null
  n_disagree?: number | null
  n_determinate?: number | null
  n_undetermined?: number | null
  n_pairs_total?: number | null
  method?: string | null
}

export type RankValidation = {
  by_pair_class: RankPairClass[]
  interpretation?: string | null
  undetermined_note?: string | null
}

export type MaxDiffAttribute = ReportableMetric & {
  attribute: string
  rank: number | null
  bw_score: number | null
  bw_ci_low: number | null
  bw_ci_high: number | null
  p_best?: number | null
  p_worst?: number | null
  n_best?: number | null
  n_worst?: number | null
  n_shown?: number | null
}

export type AttributeImportance = {
  attributes: MaxDiffAttribute[]
  scale?: string | null
  method?: string | null
  interpretation?: string | null
  estimator_note?: string | null
  variance_note?: string | null
  presentation_control?: string | null
  answer_set_code?: string | null
}

export type RepurchaseSessionMetric = ReportableMetric & {
  session_number: number
  metric: 'definite_yes' | 'no' | 'top_two_box' | string
  rate: number | null
}

export type RepurchaseIntent = {
  by_session: RepurchaseSessionMetric[]
  interpretation?: string | null
  timing_note?: string | null
  presentation_control?: string | null
}

export type ExperienceLift = ReportableMetric & {
  mean_elo_delta: number | null
  sd_elo_delta?: number | null
  n_moved_up?: number | null
  n_moved_down?: number | null
  n_unchanged?: number | null
  n_users_with_baseline?: number | null
  n_users_no_baseline?: number | null
  signal_class?: string | null
  method?: string | null
  confound_warning: string | null
}

export type Methodology = {
  floors?: Record<string, unknown> | null
  estimand?: string | null
  comparison_task?: string | null
  instrument?: string | null
  win_rate_method?: string | null
  exclusions?: Record<string, unknown> | string | null
  experience_definition?: string | null
  withheld_semantics?: string | null
  absent_section_semantics?: string | null
  independence_note?: string | null
  multiple_comparison_note?: string | null
  drift_causality_note?: string | null
  presentation_control?: string | null
  evidence_note?: string | null
  inference_note?: string | null
  [key: string]: unknown
}

export type ExperiencedReportPayload = {
  focal_product: FocalProduct
  participation: Participation
  report_stage: ReportStage
  reliability: Reliability | null
  evidence_composition: EvidenceComposition | null
  methodology: Methodology | null
  headline_win_rate: HeadlineWinRateRow[]
  per_opponent: OpponentRow[] | null
  choice_drivers: ChoiceDrivers | null
  rank_validation: RankValidation | null
  attribute_importance: AttributeImportance | null
  repurchase_intent: RepurchaseIntent | null
  experience_lift_vs_baseline: ExperienceLift | null
}

export type ExperiencedReportEnvelope = {
  status: 'ok'
  is_simulated: boolean
  report_id: string | null
  mission_id: string
  brand_id: number | null
  focal_product_id: number | null
  snapshot_date: string | null
  computed_at: string | null
  is_current: boolean
  report: ExperiencedReportPayload
}

export type ExperiencedReportErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_A_PORTAL_USER'
  | 'NO_REPORT_YET'
  | 'FORBIDDEN'
  | 'FETCH_ERROR'

export type ExperiencedReportLoadResult =
  | { ok: true; envelope: ExperiencedReportEnvelope }
  | { ok: false; code: ExperiencedReportErrorCode; detail?: string }
