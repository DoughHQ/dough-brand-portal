/**
 * CONCEPT_CORE_V1 report — pure renderer of report_concept_test.json shape.
 * CONCEPT_CORE_V1 verdict payload.
 */
import {
  parseSampleComposition,
  type SampleComposition,
} from '../reportSampleComposition'
import { parseConceptTestReport } from './conceptTestReport'
export { parseConceptTestReport } from './conceptTestReport'

export type ConceptTestVerdictResult =
  | 'cleared'
  | 'not_cleared'
  | 'too_close_to_call'
  | 'not_enough_responses'
  | string

export type ConceptTestInterval = {
  lo: number
  hi: number
  bar: number
  result: ConceptTestVerdictResult
  dough_default: number
}

export type ConceptTestVerdict = {
  ref: number
  name: string
  overall: ConceptTestVerdictResult
  head_to_head: ConceptTestInterval & {
    wins: number
    losses: number
    neither: number
    win_share: number
    /** Equal-field report: respondents are the unit. */
    n_respondents: number
    basis?: 'field' | string
    /** Legacy benchmark-paired shape. Prefer n_respondents. */
    n_decisive?: number
  }
  liking: ConceptTestInterval & {
    mode: string
    n_paired?: number
    difference_top_two?: number
  }
  price: ConceptTestInterval & {
    n: number
    anchor: number
    share_generous: number
    share_conservative: number
  }
}

export type ConceptWhatMattersItem = {
  value: string
  label: string
  utility: number | null
  std_error: number | null
  rank: number | null
  times_best: number | null
  times_worst: number | null
}

export type ConceptTestReport = {
  flow: string
  sample_composition?: SampleComposition | null
  sample: {
    n_started: number
    n_completed: number
    n_screened_out: number
    n_battles_excluded_for_timing: number
  }
  benchmark: { ref: number; name: string; role: string } | null
  bars: Record<string, unknown> | null
  verdict: ConceptTestVerdict[]
  first_look: Array<{
    ref: number
    name: string
    n: number
    is_benchmark: boolean
    top_box: { share: number; lo: number; hi: number }
    top_two: { share: number; lo: number; hi: number }
    distribution: Array<{ label: string; n: number; share: number }>
  }>
  what_matters: {
    note?: string
    detail?: string
    n_respondents?: number
    method?: string
    fallback_reason?: string
    items: ConceptWhatMattersItem[]
  } | null
  stated_vs_chosen: {
    n_rankings: number
    top_pick_agreement: number
    mean_pair_agreement: number
    n_top_pick_comparable: number
  } | null
  price: Array<{
    ref: number
    name: string
    is_benchmark: boolean
    report: {
      modal_band?: { label: string } | null
      demand_curve?: Array<{ price: number; share_would_pay_gte: number }>
      rejection_rate?: number
      n_answers?: number
      presentation_rule?: string
      below_reporting_floor?: boolean
    }
  }>
  brand_questions: Array<{
    prompt: string
    framing?: string
    brand_written?: boolean
    n: number
    options: Array<{ option: string; n: number }>
  }>
  open_text: {
    answers: Array<{
      text: string
      first_look?: Record<string, string>
    }>
    scrub_note?: string
  } | null
  method: Record<string, string> | null
}

export function asRecord(v: unknown): Record<string, unknown> | null {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

export function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

/** True when payload is the single-test report shape (not legacy win_rate_field). */
export function isConceptTestReportPayload(payload: unknown): boolean {
  const r = asRecord(payload)
  if (!r) return false
  if (r.flow === 'concept_core_v1') return true
  if (Array.isArray(r.verdict) && !Array.isArray(r.win_rate_field)) return true
  return false
}


/**
 * The production RPC wraps CONCEPT_CORE_V1 under `concept_test`; previews and
 * older snapshots may expose it directly or under `report` / `data`.
 */
export function parseConceptTestEnvelope(
  payload: unknown,
): ConceptTestReport | null {
  const outer = asRecord(payload)
  const outerComposition = parseSampleComposition(outer?.sample_composition)
  const candidates = [payload, outer?.concept_test, outer?.report, outer?.data]
  for (const candidate of candidates) {
    if (isConceptTestReportPayload(candidate)) {
      const report = parseConceptTestReport(candidate)
      return report
        ? { ...report, sample_composition: report.sample_composition ?? outerComposition }
        : null
    }
    const nested = asRecord(candidate)
    if (isConceptTestReportPayload(nested?.concept_test)) {
      const report = parseConceptTestReport(nested?.concept_test)
      return report
        ? { ...report, sample_composition: report.sample_composition ?? outerComposition }
        : null
    }
  }
  return null
}
