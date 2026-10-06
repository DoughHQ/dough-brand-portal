/**
 * IHUT_CORE_V1 report — renderer types for compute_ihut_core_sections().
 */

export type IhutCoreStrengthRow = {
  ref: number
  name: string
  is_yours?: boolean
  strength?: number | string | null
  rank?: number | null
}

export type IhutCoreMapRow = {
  ref: number
  name: string
  is_yours?: boolean
  shelf_strength?: number | string | null
  taste_strength?: number | string | null
}

export type IhutCoreShareRow = {
  ref: number
  name: string
  n: number
  top_two_share?: number | null
  yes_share?: number | null
  maybe_share?: number | null
  no_share?: number | null
  yes_n?: number | null
  maybe_n?: number | null
  no_n?: number | null
  first_share?: number | null
  avg_rank?: number | null
  liked_and_expected_good_share?: number | null
  liked_share?: number | null
  lo?: number | null
  hi?: number | null
  maybe_lo?: number | null
  maybe_hi?: number | null
  no_lo?: number | null
  no_hi?: number | null
  tested_price_dollars?: number | null
  session_number?: number | null
  reportable?: boolean
  decision_ready?: boolean
  label?: string | null
}

export type IhutTestedPriceRow = {
  ref: number
  name: string
  is_yours?: boolean
  price_dollars?: number | null
  price_cents?: number | null
}

export type IhutPriceTransitionRow = {
  ref: number
  name: string
  n_paired: number
  matrix?: Record<string, number | null>
  improved_n?: number | null
  worsened_n?: number | null
  stable_n?: number | null
  improved_share?: number | null
  worsened_share?: number | null
  stable_share?: number | null
  reportable?: boolean
  label?: string | null
}

export type IhutValueLeakageRow = {
  ref: number
  name: string
  n_first: number
  n_first_but_no_at_price: number
  share?: number | null
  reportable?: boolean
  label?: string | null
  interpretation?: string | null
}

export type IhutPriceIntent = {
  analysis_version: 'IHUT_PRICE_V2' | string
  label: 'tested_offer_intent' | string
  interpretation: string
  price_check_enabled: boolean
  descriptive_floor?: number
  decision_floor?: number
  tested_prices: IhutTestedPriceRow[]
  day1: IhutCoreShareRow[]
  day2: IhutCoreShareRow[]
  day1_to_day2: IhutPriceTransitionRow[]
  value_leakage: IhutValueLeakageRow[]
}

export type IhutCoreAttributeRow = {
  ref: number
  name: string
  attribute: string
  attribute_label: string
  n: number
  too_little_share?: number | null
  just_right_share?: number | null
  too_much_share?: number | null
}

export type IhutCoreWhyRow = {
  answer: string
  n: number
}

export type IhutCoreCountRow = {
  answer: string
  n: number
}

export type IhutBarResult =
  | 'cleared'
  | 'not_cleared'
  | 'too_close_to_call'
  | 'not_enough_responses'
  | 'not_tested'

export type IhutCoreBarMetric = {
  bar?: number | null
  n?: number | null
  wins?: number | null
  share?: number | null
  lo?: number | null
  hi?: number | null
  result: IhutBarResult | string
}

export type IhutCoreVerdict = {
  ref: number
  name: string
  taste_win: IhutCoreBarMetric
  liking: IhutCoreBarMetric
  buy_at_price: IhutCoreBarMetric
  overall: IhutBarResult | string
}

export type IhutCoreDay2 = {
  preference_hold: {
    n: number
    same_favorite_share?: number | null
  }
  consumption: IhutCoreCountRow[]
  wear: IhutCoreCountRow[]
  /** Present after IHUT_PRICE_V2 compute; absent on older freezes. */
  price_check?: IhutCoreShareRow[]
}

export type IhutCoreReport = {
  version: 'IHUT_CORE_V1'
  /** Additive report analytics version. Method pack remains IHUT_CORE_V1. */
  analysis_version?: 'REPORT_V2' | string
  taste_only: boolean
  price_check_enabled?: boolean
  success_bars: {
    taste_win_share?: number
    liking_share?: number
    buy_at_price_share?: number | null
  }
  promise_vs_delivery: {
    shelf: IhutCoreStrengthRow[]
    taste: IhutCoreStrengthRow[]
    map: IhutCoreMapRow[]
    note: string
  }
  liking: IhutCoreShareRow[]
  price_check: IhutCoreShareRow[]
  /** Full tested-offer intent chapter. Absent on freezes before IHUT_PRICE_V2. */
  price_intent?: IhutPriceIntent | null
  attribute_penalties: IhutCoreAttributeRow[]
  expectation_vs_experience: IhutCoreShareRow[]
  buy_order: IhutCoreShareRow[]
  taste_why: IhutCoreWhyRow[]
  day2: IhutCoreDay2
  verdict: IhutCoreVerdict | Record<string, never>
}

export function isIhutCoreReport(value: unknown): value is IhutCoreReport {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return v.version === 'IHUT_CORE_V1' && typeof v.promise_vs_delivery === 'object'
}

export function hasIhutVerdict(
  verdict: IhutCoreReport['verdict']
): verdict is IhutCoreVerdict {
  return (
    !!verdict &&
    typeof verdict === 'object' &&
    typeof (verdict as IhutCoreVerdict).ref === 'number' &&
    typeof (verdict as IhutCoreVerdict).overall === 'string'
  )
}
