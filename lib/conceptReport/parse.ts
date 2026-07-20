import type {
  ConceptMissionReport,
  DecisionFrame,
  Finding,
  PairMatchup,
  TopPairRecord,
  PairCoverage,
  PositionBiasCheck,
  Connectivity,
  DesignEffectSummary,
  WinRateFieldRow,
  HeadlineKind,
  QuestionResponse,
  QuestionAggregate,
} from './types'
import { decisionFrameFromFinding } from './copy'

function asObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function asArray(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : []
}

function asString(raw: unknown, fallback = ''): string {
  return typeof raw === 'string' ? raw : fallback
}

function asNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return Number(raw)
  }
  return null
}

function asBool(raw: unknown, fallback = false): boolean {
  return typeof raw === 'boolean' ? raw : fallback
}

function parseWinRateField(raw: unknown): WinRateFieldRow[] {
  const rows: WinRateFieldRow[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const combatant_ref = asNumber(o.combatant_ref)
    const display_name = asString(o.display_name).trim()
    if (combatant_ref == null || !display_name) continue
    rows.push({
      combatant_ref,
      display_name,
      battle_intent: asString(o.battle_intent, 'direct_competitor'),
      kind: asString(o.kind, 'product'),
      rank: asNumber(o.rank) ?? 999,
      placeable: asBool(o.placeable, false),
      win_rate_of_100: asNumber(o.win_rate_of_100),
      win_rate_lo: asNumber(o.win_rate_lo),
      win_rate_hi: asNumber(o.win_rate_hi),
      frozen_price: (o.frozen_price as number | string | null | undefined) ?? null,
      image_url:
        typeof o.image_url === 'string'
          ? o.image_url
          : typeof o.frozen_image_url === 'string'
            ? o.frozen_image_url
            : null,
    })
  }
  return rows.sort((a, b) => a.rank - b.rank)
}

function parseFindingCombatant(raw: unknown) {
  const o = asObject(raw)
  if (!o) return null
  const display_name = asString(o.display_name).trim()
  if (!display_name) return null
  return {
    combatant_ref: asNumber(o.combatant_ref) ?? undefined,
    display_name,
    kind: asString(o.kind) || undefined,
    battle_intent: asString(o.battle_intent) || undefined,
    win_rate_of_100: asNumber(o.win_rate_of_100),
  }
}

function parseDecisionFrame(raw: unknown): DecisionFrame | null {
  const o = asObject(raw)
  if (!o) return null

  // New shape: posture / action / rationale / headline_kind
  const action = asString(o.action).trim()
  const rationale = asString(o.rationale).trim()
  if (action && rationale) {
    const hk = asString(o.headline_kind, 'provisional') as HeadlineKind
    return {
      posture: asString(o.posture, 'mixed'),
      action,
      rationale,
      headline_kind: hk === 'confident' ? 'confident' : 'provisional',
    }
  }

  // Legacy shape → map into new frame
  const nextLabel = asString(o.next_action_label).trim()
  const body = asString(o.body).trim() || asString(o.next_action_detail).trim()
  if (nextLabel && body) {
    const status = asString(o.status, 'mixed')
    const posture =
      status === 'statistical_tie'
        ? 'tie_break_needed'
        : status === 'early_read'
          ? 'early_read'
          : status === 'products_lead'
            ? 'products_lead'
            : status === 'decisive'
              ? 'concept_ahead'
              : 'mixed'
    return {
      posture,
      action: nextLabel,
      rationale: body,
      headline_kind: posture === 'early_read' || posture === 'tie_break_needed' ? 'provisional' : 'confident',
    }
  }

  return null
}

function parseFinding(raw: unknown): Finding | null {
  const o = asObject(raw)
  if (!o) return null
  const top = parseFindingCombatant(o.top)
  if (!top) return null
  return {
    top,
    relationship_to_field: asString(o.relationship_to_field, 'products_lead_concepts'),
    is_tie: asBool(o.is_tie, false),
    tie_with: parseFindingCombatant(o.tie_with),
    is_thin: asBool(o.is_thin, false),
    suggested_additional_respondents: asNumber(o.suggested_additional_respondents),
    note: asString(o.note),
    decision_frame: parseDecisionFrame(o.decision_frame),
  }
}

function parseMatchups(raw: unknown): PairMatchup[] {
  const rows: PairMatchup[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const opponent_ref = asNumber(o.opponent_ref)
    const opponent_name = asString(o.opponent_name).trim()
    const top_wins = asNumber(o.top_wins) ?? asNumber(o.wins)
    const opponent_wins = asNumber(o.opponent_wins) ?? asNumber(o.losses)
    const shown = asNumber(o.shown)
    if (
      opponent_ref == null ||
      !opponent_name ||
      top_wins == null ||
      opponent_wins == null ||
      shown == null
    ) {
      continue
    }
    rows.push({
      opponent_ref,
      opponent_name,
      opponent_kind: asString(o.opponent_kind) || null,
      opponent_intent: asString(o.opponent_intent) || null,
      top_wins,
      opponent_wins,
      shown,
    })
  }
  return rows
}

function parseTopPairRecord(raw: unknown): TopPairRecord | null {
  if (raw == null) return null

  // New nested object
  const o = asObject(raw)
  if (o && (Array.isArray(o.vs) || o.display_name)) {
    const vs = parseMatchups(o.vs)
    if (vs.length === 0 && !asString(o.display_name)) return null
    return {
      display_name: asString(o.display_name),
      kind: asString(o.kind) || null,
      battle_intent: asString(o.battle_intent) || null,
      combatant_ref: asNumber(o.combatant_ref),
      vs,
    }
  }

  // Legacy flat array → wrap
  if (Array.isArray(raw)) {
    const vs = parseMatchups(
      raw.map((item) => {
        const row = asObject(item)
        if (!row) return item
        return {
          ...row,
          top_wins: row.top_wins ?? row.wins,
          opponent_wins: row.opponent_wins ?? row.losses,
        }
      })
    )
    if (vs.length === 0) return null
    return {
      display_name: '',
      kind: null,
      battle_intent: null,
      combatant_ref: null,
      vs,
    }
  }

  return null
}

function parsePositionBias(raw: unknown): PositionBiasCheck | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    shown_first_win_rate: asNumber(o.shown_first_win_rate),
    gap_from_0_5: asNumber(o.gap_from_0_5),
    note: asString(o.note) || null,
  }
}

function parseCoverage(raw: unknown): PairCoverage | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    mean_shown: asNumber(o.mean_shown),
    min_shown: asNumber(o.min_shown),
    max_shown: asNumber(o.max_shown),
    note: asString(o.note) || null,
  }
}

function parseConnectivity(raw: unknown): Connectivity | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    fully_connected: asBool(o.fully_connected, false),
    n_components: asNumber(o.n_components),
    note: asString(o.note) || null,
  }
}

function parseDesignEffect(raw: unknown): DesignEffectSummary | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    mean_design_effect: asNumber(o.mean_design_effect),
    n_clusters: asNumber(o.n_clusters),
    interpretation: asString(o.interpretation) || null,
  }
}

function parseStringNumberMap(raw: unknown): Record<string, number> {
  const o = asObject(raw)
  if (!o) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(o)) {
    const n = asNumber(v)
    if (n != null) out[k] = n
  }
  return out
}

function parseQuestionAggregate(raw: unknown): QuestionAggregate {
  const o = asObject(raw)
  if (!o) {
    return { n_answers: null, distribution: {}, shares: {} }
  }
  return {
    n_answers: asNumber(o.n_answers),
    distribution: parseStringNumberMap(o.distribution),
    shares: parseStringNumberMap(o.shares),
    framing: asString(o.framing) || null,
    presentation_rule: asString(o.presentation_rule) || null,
  }
}

/** Pass through every entry — never drop unknown signal_kind. */
function parseQuestionResponses(raw: unknown): QuestionResponse[] {
  const rows: QuestionResponse[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const prompt = asString(o.prompt).trim() || asString(o.display_name).trim()
    if (!prompt) continue
    rows.push({
      question_type_code: asString(o.question_type_code, 'unknown'),
      display_name: asString(o.display_name) || null,
      prompt,
      session_number: asNumber(o.session_number),
      position: asNumber(o.position),
      signal_kind: asString(o.signal_kind, 'unknown'),
      framing_note: asString(o.framing_note) || null,
      aggregate: parseQuestionAggregate(o.aggregate),
    })
  }
  return rows.sort((a, b) => {
    const pa = a.position ?? 999
    const pb = b.position ?? 999
    if (pa !== pb) return pa - pb
    return (a.session_number ?? 0) - (b.session_number ?? 0)
  })
}

function countKinds(field: WinRateFieldRow[]): { n_concepts: number; n_products: number } {
  let n_concepts = 0
  let n_products = 0
  for (const row of field) {
    if (row.kind === 'concept') n_concepts += 1
    else if (row.kind === 'product') n_products += 1
  }
  return { n_concepts, n_products }
}

export function parseConceptMissionReport(
  raw: unknown,
  opts?: { missionId?: string }
): ConceptMissionReport | null {
  const o = asObject(raw)
  if (!o) return null

  const id = asString(o.report_id) || asString(o.id) || asString(opts?.missionId)
  const mission_id = asString(o.mission_id) || asString(opts?.missionId)
  const computed_at =
    asString(o.computed_at) || asString(o.snapshot_date) || new Date(0).toISOString()
  const win_rate_field = parseWinRateField(o.win_rate_field)
  const finding = parseFinding(o.finding)

  if (!mission_id || !finding) return null
  if (win_rate_field.length === 0) return null

  const kinds = countKinds(win_rate_field)
  const thinHint =
    finding.is_thin ||
    asString(o.min_cluster_warning).trim().length > 0 ||
    win_rate_field.every((r) => !r.placeable)

  const decision_frame =
    finding.decision_frame ??
    parseDecisionFrame(o.decision_frame) ??
    decisionFrameFromFinding(finding, thinHint)

  // If thin, force provisional headline_kind even if server sent confident
  const frame: DecisionFrame = thinHint
    ? { ...decision_frame, headline_kind: 'provisional', posture: decision_frame.posture === 'early_read' ? decision_frame.posture : 'early_read' }
    : decision_frame

  return {
    id,
    mission_id,
    study_title: asString(o.study_title) || null,
    category_label: asString(o.category_label) || null,
    price_posture_label: asString(o.price_posture_label) || null,
    prices_shown: asBool(o.prices_shown, false),
    report_maturity: asString(o.report_maturity) || null,
    snapshot_date: asString(o.snapshot_date) || null,
    computed_at,
    is_current: asBool(o.is_current, true),
    n_concepts: asNumber(o.n_concepts) ?? kinds.n_concepts,
    n_products: asNumber(o.n_products) ?? kinds.n_products,
    n_respondents: asNumber(o.n_respondents) ?? 0,
    n_decisive_battles: asNumber(o.n_decisive_battles) ?? 0,
    n_neither: asNumber(o.n_neither),
    neither_rate: asNumber(o.neither_rate),
    n_combatants: asNumber(o.n_combatants) ?? win_rate_field.length,
    win_rate_field,
    finding: { ...finding, is_thin: finding.is_thin || thinHint },
    decision_frame: frame,
    top_pair_record: parseTopPairRecord(o.top_pair_record),
    question_responses: parseQuestionResponses(o.question_responses),
    position_bias_check: parsePositionBias(o.position_bias_check),
    achieved_pair_coverage: parseCoverage(o.achieved_pair_coverage),
    connectivity: parseConnectivity(o.connectivity),
    design_effect_summary: parseDesignEffect(o.design_effect_summary),
    min_cluster_warning: asString(o.min_cluster_warning),
    is_simulated: o.is_simulated === true,
  }
}
