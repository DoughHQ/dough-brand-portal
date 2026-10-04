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
  first_share?: number | null
  avg_rank?: number | null
  liked_and_expected_good_share?: number | null
  liked_share?: number | null
  lo?: number | null
  hi?: number | null
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
}

export type IhutCoreReport = {
  version: 'IHUT_CORE_V1'
  taste_only: boolean
  success_bars: {
    taste_win_share?: number
    liking_share?: number
    buy_at_price_share?: number
  }
  promise_vs_delivery: {
    shelf: IhutCoreStrengthRow[]
    taste: IhutCoreStrengthRow[]
    map: IhutCoreMapRow[]
    note: string
  }
  liking: IhutCoreShareRow[]
  price_check: IhutCoreShareRow[]
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
