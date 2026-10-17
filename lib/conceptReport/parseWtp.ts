import type {
  QuestionAggregate,
  QuestionResponse,
  WinRateFieldRow,
  WtpArm,
  WtpArmReport,
  WtpBand,
  WtpDemandPoint,
} from './types'
import {
  asArray,
  asBool,
  asNumber,
  asObject,
  asString,
} from './parse'

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

function parseWtpBands(raw: unknown): WtpBand[] {
  const rows: WtpBand[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const band_id = asString(o.band_id).trim()
    if (!band_id) continue
    rows.push({
      band_id,
      label: asString(o.label) || null,
      low: asNumber(o.low),
      high: asNumber(o.high),
      count: asNumber(o.count) ?? 0,
    })
  }
  return rows
}

function parseDemandCurve(raw: unknown): WtpDemandPoint[] {
  const rows: WtpDemandPoint[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const price = asNumber(o.price)
    const share = asNumber(o.share_would_pay_gte)
    if (price == null || share == null) continue
    rows.push({ price, share_would_pay_gte: share })
  }
  return rows.sort((a, b) => a.price - b.price)
}

function parseWtpArmReport(raw: unknown): WtpArmReport | null {
  const o = asObject(raw)
  if (!o) return null
  const modal = asObject(o.modal_band)
  return {
    n_answers: asNumber(o.n_answers),
    n_priced: asNumber(o.n_priced),
    n_reject: asNumber(o.n_reject),
    rejection_rate: asNumber(o.rejection_rate),
    below_reporting_floor: asBool(o.below_reporting_floor, false),
    reporting_floor: asNumber(o.reporting_floor),
    modal_band: modal
      ? { label: asString(modal.label) || null, low: asNumber(modal.low), high: asNumber(modal.high) }
      : null,
    band_distribution: parseWtpBands(o.band_distribution),
    demand_curve: parseDemandCurve(o.demand_curve),
    presentation_rule: asString(o.presentation_rule) || null,
    cap_note: asString(o.cap_note) || null,
    suppression_note: asString(o.suppression_note) || null,
    note: asString(o.note) || null,
  }
}

function parseWtpArms(raw: unknown): WtpArm[] {
  const rows: WtpArm[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const report = parseWtpArmReport(o.report)
    if (!report) continue
    rows.push({
      combatant_ref: asNumber(o.combatant_ref),
      display_name: asString(o.display_name) || null,
      report,
    })
  }
  return rows
}

function parseQuestionAggregate(raw: unknown): QuestionAggregate {
  const o = asObject(raw)
  if (!o) {
    return { n_answers: null, distribution: {}, shares: {} }
  }
  const base: QuestionAggregate = {
    n_answers: asNumber(o.n_answers),
    distribution: parseStringNumberMap(o.distribution),
    shares: parseStringNumberMap(o.shares),
    framing: asString(o.framing) || null,
    presentation_rule: asString(o.presentation_rule) || null,
  }
  // Willingness-to-pay branch carries per-arm demand curves instead of a flat distribution.
  if (o.signal === 'per_arm_reservation_price' || o.by_arm != null || o.overall != null) {
    base.wtp_signal = asString(o.signal) || null
    base.wtp_reporting_floor = asNumber(o.reporting_floor)
    base.wtp_overall = parseWtpArmReport(o.overall)
    base.wtp_by_arm = parseWtpArms(o.by_arm)
    base.wtp_interpretation = asString(o.interpretation) || null
  }
  return base
}

/** Pass through every entry — never drop unknown signal_kind. */
export function parseQuestionResponses(raw: unknown): QuestionResponse[] {
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

export function countKinds(field: WinRateFieldRow[]): { n_concepts: number; n_products: number } {
  let n_concepts = 0
  let n_products = 0
  for (const row of field) {
    if (row.kind === 'concept') n_concepts += 1
    else if (row.kind === 'product') n_products += 1
  }
  return { n_concepts, n_products }
}
