/**
 * Portal mirror of dough_app/src/lib/concept/types.ts plan-screen union.
 * Renderer consumes this only. Keep fields aligned with the Expo runner.
 */

export type ConceptBattleOutcome = 'A_WIN' | 'B_WIN' | 'NEITHER' | 'SKIP' | 'TIMEOUT'

export type PresentedPosition = 'a_left' | 'b_left'

export type ConceptStimulusMode = string | null

export type ConceptScreenBase = {
  screen: number
  kind: string
  answered?: boolean
  answerable?: boolean | null
}

export type ConceptOption = {
  label: string
  value?: string
  id?: string
  low?: number | null
  high?: number | null
}

export type ConceptScreenConfig = {
  prompt?: string
  options?: string[] | ConceptOption[]
  min_select?: number
  max_select?: number
  answer_set_code?: string
  response?: string
  max_length?: number
  render?: string
  suppress_name?: boolean
  focal_arm?: string
  sampled?: boolean
  linked_to?: string
  qualify_rule?: { op: string; value: string | number | string[] } | null
}

export type ConceptPlanSubject = {
  ref: number
  name?: string
  brand?: string | null
  image_url?: string | null
  image_unavailable?: boolean
  price?: number | null
  kind?: string
}

export type ConceptScreenerScreen = ConceptScreenBase & {
  kind: 'screener'
  config: ConceptScreenConfig
  protocol_question_id: string
  label?: string
  question_type?: string
  is_required?: boolean
}

export type ConceptPlanCombatant = {
  ref: number
  kind: string
  name: string
  brand: string | null
  image_url: string | null
  image_unavailable?: boolean
  price: number | null
  stimulus_type?: string | null
}

export type ConceptBattleScreenPlan = ConceptScreenBase & {
  kind: 'forced_choice_battle' | 'concept_battle'
  round_number: number
  combatant_ref_a: number
  combatant_ref_b: number
  presented_position: PresentedPosition
  combatant_a?: ConceptPlanCombatant
  combatant_b?: ConceptPlanCombatant
  round_role?: 'scoring' | 'reliability' | string
  prompt?: string
  protocol_question_id?: string
  question_type?: string
  config?: ConceptScreenConfig
}

export type ConceptQuestionScreenBase = ConceptScreenBase & {
  config: ConceptScreenConfig
  protocol_question_id: string
  label?: string
  question_type?: string
  is_required?: boolean
  focal_arm?: 'assigned' | 'respondent_winner' | string
  subject?: ConceptPlanSubject | null
  subject_ref?: number | null
  resolve_subject?: 'client_session_winner' | string
}

export type ConceptDiagnosticScreen = ConceptQuestionScreenBase & {
  kind: 'diagnostic'
}

export type ConceptFloorScreen = ConceptQuestionScreenBase & {
  kind: 'floor'
}

export type ConceptProbeScreen = ConceptQuestionScreenBase & {
  kind: 'probe'
}

export type ConceptSessionSummaryScreen = ConceptScreenBase & {
  kind: 'session_summary'
  session_number?: number
}

export type ConceptAttributeFollowupScreen = ConceptScreenBase & {
  kind: 'attribute_followup'
  linked_round_number: number
  combatant_ref_a: number
  combatant_ref_b: number
  winner_ref?: number | null
  prompt_id?: number | null
  protocol_question_id?: string
  label?: string
  question_type?: string
  is_required?: boolean
  config?: ConceptScreenConfig
}

export type ConceptPlanScreen =
  | ConceptScreenerScreen
  | ConceptBattleScreenPlan
  | ConceptDiagnosticScreen
  | ConceptFloorScreen
  | ConceptProbeScreen
  | ConceptAttributeFollowupScreen
  | ConceptSessionSummaryScreen

export function isBattleKind(
  k: string | undefined
): k is ConceptBattleScreenPlan['kind'] {
  return k === 'forced_choice_battle' || k === 'concept_battle'
}

export function isBattleScreen(
  s: ConceptPlanScreen
): s is ConceptBattleScreenPlan {
  return isBattleKind(s.kind)
}

export function isConceptChoiceKind(
  kind: string
): kind is 'screener' | 'diagnostic' | 'floor' | 'probe' {
  return (
    kind === 'screener' ||
    kind === 'diagnostic' ||
    kind === 'floor' ||
    kind === 'probe'
  )
}

export type ConceptChoiceScreen =
  | ConceptScreenerScreen
  | ConceptDiagnosticScreen
  | ConceptFloorScreen
  | ConceptProbeScreen

export function isConceptChoiceScreen(
  s: ConceptPlanScreen
): s is ConceptChoiceScreen {
  return isConceptChoiceKind(s.kind)
}

export function shouldSuppressCombatantLabels(params: {
  stimulusMode?: ConceptStimulusMode
  config?: ConceptScreenConfig | null
}): boolean {
  const mode = (params.stimulusMode ?? '').toString().trim().toLowerCase()
  if (mode === 'package' || mode === 'price') return true
  const cfg = params.config
  if (cfg?.suppress_name === true) return true
  if ((cfg?.render ?? '').toString().trim().toLowerCase() === 'image_only') {
    return true
  }
  return false
}

export type ProtocolQuestion = {
  id?: string
  question_type_code: string
  session_number: number
  position: number
  label: string
  config: Record<string, unknown>
  is_required: boolean
  drives_rounds: boolean
}
