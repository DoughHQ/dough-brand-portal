export const MIN_COMPLETIONS_FLOOR = 30
export const MAX_COMPLETIONS = 500 // TODO: arbitrary, revisit with real data
export const EXPECTED_COMPLETION_RATE = 0.6
export const PLATFORM_FEE_CENTS = 150_000 // flat per-campaign fee, not per-completion
export const MAX_BRAND_QUESTIONS_PER_SESSION = 3
export const DEFAULT_PAYOUT_PER_USER_CENTS = 600 // illustrative, single source of truth

/**
 * Template-path ordered completions.
 * Soft floor (50) is OFF while we test with small N — flip ENFORCE to true later.
 * Absolute backend minimum is always >= 1 (INVALID_TARGET_COMPLETIONS).
 */
export const ENFORCE_TEMPLATE_COMPLETIONS_FLOOR = false
export const TEMPLATE_COMPLETIONS_SOFT_FLOOR = 50
export const TEMPLATE_COMPLETIONS_ABSOLUTE_MIN = 1
/** Suggested default in the completions step (independent of soft-floor enforcement). */
export const TEMPLATE_DEFAULT_COMPLETIONS = 50

export function minTemplateCompletions(): number {
  return ENFORCE_TEMPLATE_COMPLETIONS_FLOOR
    ? TEMPLATE_COMPLETIONS_SOFT_FLOOR
    : TEMPLATE_COMPLETIONS_ABSOLUTE_MIN
}

// Maps wizard study types to real mission_type enum values (legacy create path).
export const MISSION_TYPE_MAP = {
  discovery: 'product_discovery',
  positioning: 'brand_challenge',
  head_to_head: 'brand_challenge',
} as const

// Maps wizard study types to campaign_objective enum values
export const CAMPAIGN_OBJECTIVE_MAP = {
  discovery: 'trial',
  positioning: 'depth',
  head_to_head: 'conquest',
} as const

export const REQUIRED_QUESTION_CODES = [
  'consumption_probe_s1',
  'consumption_probe_s2',
  'elo_battle',
  'repurchase_probe',
]
export const H2H_REQUIRED_QUESTION_CODES = [
  'consumption_probe_s1',
  'consumption_probe_s2',
  'elo_battle',
  'substitution_map',
  'repurchase_probe',
]
