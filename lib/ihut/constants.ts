export const MIN_COMPLETIONS_FLOOR = 30
export const MAX_COMPLETIONS = 500 // TODO: arbitrary, revisit with real data
export const EXPECTED_COMPLETION_RATE = 0.6
export const PLATFORM_FEE_CENTS = 150_000 // flat per-campaign fee, not per-completion
export const MAX_BRAND_QUESTIONS_PER_SESSION = 3
export const DEFAULT_PAYOUT_PER_USER_CENTS = 600 // illustrative, single source of truth

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
