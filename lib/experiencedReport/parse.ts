import type {
  AttributeImportance,
  ChoiceDrivers,
  DriverRow,
  EvidenceComposition,
  ExperienceLift,
  ExperiencedReportEnvelope,
  ExperiencedReportPayload,
  FocalProduct,
  HeadlineWinRateRow,
  MaxDiffAttribute,
  Methodology,
  OpponentRow,
  Participation,
  RankPairClass,
  RankValidation,
  Reliability,
  ReportableMetric,
  ReportStage,
  RepurchaseIntent,
  RepurchaseSessionMetric,
} from './types'

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

function parseMetricBase(o: Record<string, unknown>): ReportableMetric {
  return {
    value: asNumber(o.value) ?? asNumber(o.rate) ?? asNumber(o.share) ?? asNumber(o.consistency_rate),
    ci_low: asNumber(o.ci_low),
    ci_high: asNumber(o.ci_high),
    reportable: asBool(o.reportable, false),
    withheld_reason: asString(o.withheld_reason) || null,
    n_users: asNumber(o.n_users),
    n_decisive: asNumber(o.n_decisive),
    n_answers: asNumber(o.n_answers),
    n_wins: asNumber(o.n_wins),
    n_ties: asNumber(o.n_ties),
    n_positive: asNumber(o.n_positive),
    n_citing: asNumber(o.n_citing),
  }
}

function parseFocal(raw: unknown): FocalProduct | null {
  const o = asObject(raw)
  if (!o) return null
  const name = asString(o.name).trim() || asString(o.product_name).trim()
  if (!name) return null
  return {
    product_id: asNumber(o.product_id),
    name,
    brand: asString(o.brand) || asString(o.brand_name) || null,
  }
}

function parseParticipation(raw: unknown): Participation {
  const o = asObject(raw) ?? {}
  return {
    n_users: asNumber(o.n_users) ?? 0,
    n_claims: asNumber(o.n_claims) ?? 0,
    n_sessions: asNumber(o.n_sessions) ?? 0,
  }
}

function parseStage(raw: unknown): ReportStage {
  const o = asObject(raw) ?? {}
  const stage = asString(o.stage, 'preliminary')
  return {
    stage,
    is_final: asBool(o.is_final, stage === 'final'),
    mission_status: asString(o.mission_status) || null,
    target_completions: asNumber(o.target_completions),
    completions_delivered: asNumber(o.completions_delivered),
    stage_semantics: asString(o.stage_semantics) || null,
  }
}

function parseHeadline(raw: unknown): HeadlineWinRateRow[] {
  const rows: HeadlineWinRateRow[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    rows.push({
      ...parseMetricBase(o),
      method: asString(o.method) || null,
      experience_split: asString(o.experience_split, 'experienced_vs_experienced'),
    })
  }
  return rows
}

function parseOpponents(raw: unknown): OpponentRow[] | null {
  if (raw == null) return null
  const rows: OpponentRow[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const name = asString(o.opponent_name).trim()
    if (!name) continue
    rows.push({
      ...parseMetricBase(o),
      opponent_product_id: asNumber(o.opponent_product_id),
      opponent_name: name,
      opponent_brand: asString(o.opponent_brand) || null,
      experience_split: asString(o.experience_split) || null,
    })
  }
  return rows
}

function parseDrivers(raw: unknown): DriverRow[] {
  const rows: DriverRow[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const driver = asString(o.driver).trim()
    if (!driver) continue
    const base = parseMetricBase(o)
    rows.push({
      ...base,
      driver,
      share: asNumber(o.share) ?? base.value,
    })
  }
  rows.sort((a, b) => (b.share ?? -1) - (a.share ?? -1))
  return rows
}

function parseChoiceDrivers(raw: unknown): ChoiceDrivers | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const by = asObject(o.by_outcome) ?? {}
  return {
    by_outcome: {
      focal_won: parseDrivers(by.focal_won),
      focal_lost: parseDrivers(by.focal_lost),
    },
    interpretation: asString(o.interpretation) || null,
    timing_note: asString(o.timing_note) || null,
    presentation_control: asString(o.presentation_control) || null,
  }
}

function parseRankValidation(raw: unknown): RankValidation | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const by_pair_class: RankPairClass[] = []
  for (const item of asArray(o.by_pair_class)) {
    const row = asObject(item)
    if (!row) continue
    const base = parseMetricBase(row)
    by_pair_class.push({
      ...base,
      pair_class: asString(row.pair_class, 'battled'),
      agreement_rate: asNumber(row.agreement_rate) ?? base.value,
      n_agree: asNumber(row.n_agree),
      n_disagree: asNumber(row.n_disagree),
      n_determinate: asNumber(row.n_determinate),
      n_undetermined: asNumber(row.n_undetermined),
      n_pairs_total: asNumber(row.n_pairs_total),
      method: asString(row.method) || null,
    })
  }
  return {
    by_pair_class,
    interpretation: asString(o.interpretation) || null,
    undetermined_note: asString(o.undetermined_note) || null,
  }
}

function parseAttributeImportance(raw: unknown): AttributeImportance | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const attributes: MaxDiffAttribute[] = []
  for (const item of asArray(o.attributes)) {
    const row = asObject(item)
    if (!row) continue
    const attribute = asString(row.attribute).trim()
    if (!attribute) continue
    const base = parseMetricBase(row)
    attributes.push({
      ...base,
      attribute,
      rank: asNumber(row.rank),
      bw_score: asNumber(row.bw_score) ?? base.value,
      bw_ci_low: asNumber(row.bw_ci_low) ?? base.ci_low,
      bw_ci_high: asNumber(row.bw_ci_high) ?? base.ci_high,
      p_best: asNumber(row.p_best),
      p_worst: asNumber(row.p_worst),
      n_best: asNumber(row.n_best),
      n_worst: asNumber(row.n_worst),
      n_shown: asNumber(row.n_shown),
    })
  }
  attributes.sort((a, b) => (b.bw_score ?? -999) - (a.bw_score ?? -999))
  return {
    attributes,
    scale: asString(o.scale) || null,
    method: asString(o.method) || null,
    interpretation: asString(o.interpretation) || null,
    estimator_note: asString(o.estimator_note) || null,
    variance_note: asString(o.variance_note) || null,
    presentation_control: asString(o.presentation_control) || null,
    answer_set_code: asString(o.answer_set_code) || null,
  }
}

function parseRepurchase(raw: unknown): RepurchaseIntent | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const by_session: RepurchaseSessionMetric[] = []
  for (const item of asArray(o.by_session)) {
    const row = asObject(item)
    if (!row) continue
    const base = parseMetricBase(row)
    by_session.push({
      ...base,
      session_number: asNumber(row.session_number) ?? 1,
      metric: asString(row.metric, 'definite_yes'),
      rate: asNumber(row.rate) ?? base.value,
    })
  }
  return {
    by_session,
    interpretation: asString(o.interpretation) || null,
    timing_note: asString(o.timing_note) || null,
    presentation_control: asString(o.presentation_control) || null,
  }
}

function parseLift(raw: unknown): ExperienceLift | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const base = parseMetricBase(o)
  return {
    ...base,
    mean_elo_delta: asNumber(o.mean_elo_delta) ?? base.value,
    sd_elo_delta: asNumber(o.sd_elo_delta),
    n_moved_up: asNumber(o.n_moved_up),
    n_moved_down: asNumber(o.n_moved_down),
    n_unchanged: asNumber(o.n_unchanged),
    n_users_with_baseline: asNumber(o.n_users_with_baseline),
    n_users_no_baseline: asNumber(o.n_users_no_baseline),
    signal_class: asString(o.signal_class) || null,
    method: asString(o.method) || null,
    confound_warning: asString(o.confound_warning) || null,
  }
}

function parseReliability(raw: unknown): Reliability | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const base = parseMetricBase(o)
  return {
    ...base,
    consistency_rate: asNumber(o.consistency_rate) ?? base.value,
    n_consistent: asNumber(o.n_consistent),
    n_inconsistent: asNumber(o.n_inconsistent),
    n_users_with_repeats: asNumber(o.n_users_with_repeats),
    scope_note: asString(o.scope_note) || null,
  }
}

function parseEvidence(raw: unknown): EvidenceComposition | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const semanticsRaw = asObject(o.grade_semantics) ?? {}
  const grade_semantics: Record<string, string> = {}
  for (const [k, v] of Object.entries(semanticsRaw)) {
    if (typeof v === 'string') grade_semantics[k] = v
  }
  const by_grade: EvidenceComposition['by_grade'] = []
  for (const item of asArray(o.by_grade)) {
    const row = asObject(item)
    if (!row) continue
    by_grade.push({
      ...parseMetricBase(row),
      evidence_split: asString(row.evidence_split) || null,
      experience_split: asString(row.experience_split) || null,
    })
  }
  return {
    by_grade,
    grade_semantics,
    frozen_at: asString(o.frozen_at) || null,
    receipt_note: asString(o.receipt_note) || null,
    ungraded_events: asNumber(o.ungraded_events),
  }
}

function parseMethodology(raw: unknown): Methodology | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  return { ...o } as Methodology
}

export function parseExperiencedReportPayload(raw: unknown): ExperiencedReportPayload | null {
  const o = asObject(raw)
  if (!o) return null
  const focal_product = parseFocal(o.focal_product)
  if (!focal_product) return null
  const headline_win_rate = parseHeadline(o.headline_win_rate)
  if (headline_win_rate.length === 0) return null

  return {
    focal_product,
    participation: parseParticipation(o.participation),
    report_stage: parseStage(o.report_stage),
    reliability: parseReliability(o.reliability),
    evidence_composition: parseEvidence(o.evidence_composition),
    methodology: parseMethodology(o.methodology),
    headline_win_rate,
    per_opponent: parseOpponents(o.per_opponent),
    choice_drivers: parseChoiceDrivers(o.choice_drivers),
    rank_validation: parseRankValidation(o.rank_validation),
    attribute_importance: parseAttributeImportance(o.attribute_importance),
    repurchase_intent: parseRepurchase(o.repurchase_intent),
    experience_lift_vs_baseline: parseLift(o.experience_lift_vs_baseline),
  }
}

export function parseExperiencedEnvelope(
  raw: unknown,
  missionId: string
): ExperiencedReportEnvelope | null {
  const o = asObject(raw)
  if (!o) return null
  const reportRaw = o.report != null ? o.report : o
  const report = parseExperiencedReportPayload(reportRaw)
  if (!report) return null
  return {
    status: 'ok',
    is_simulated: o.is_simulated === true,
    report_id: asString(o.report_id) || null,
    mission_id: asString(o.mission_id) || missionId,
    brand_id: asNumber(o.brand_id),
    focal_product_id: asNumber(o.focal_product_id) ?? report.focal_product.product_id,
    snapshot_date: asString(o.snapshot_date) || null,
    computed_at: asString(o.computed_at) || null,
    is_current: asBool(o.is_current, true),
    report,
  }
}
