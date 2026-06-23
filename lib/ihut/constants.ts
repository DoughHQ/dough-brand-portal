export const MIN_COMPLETIONS_FLOOR = 30
export const MAX_COMPLETIONS = 500 // TODO: arbitrary, revisit with real data
export const EXPECTED_COMPLETION_RATE = 0.6
export const PLATFORM_FEE_CENTS = 150_000 // flat per-campaign fee, not per-completion
export const MAX_BRAND_QUESTIONS_PER_SESSION = 3
export const DEFAULT_PAYOUT_PER_USER_CENTS = 600 // illustrative, single source of truth

// Maps wizard study types to real mission_type enum values
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

export const STUDY_TYPES = [
  {
    key: 'discovery' as const,
    label: 'Discovery',
    question: 'What occasions and audiences is my product winning with?',
    deliverable: 'Occasion affinity map, audience profile, and win-rate breakdown by segment.',
    feeCents: 4000, // illustrative, single source of truth
  },
  {
    key: 'positioning' as const,
    label: 'Positioning',
    question: "How does my product's perceived value hold up against the category?",
    deliverable: 'ELO positioning score, value-tradeoff heat map, and narrative summary.',
    feeCents: 5500, // illustrative, single source of truth
  },
  {
    key: 'head_to_head' as const,
    label: 'Head-to-Head',
    question: 'Does my product beat specific competitors in a direct matchup?',
    deliverable: 'Head-to-head win rates, decision-speed analysis, and per-challenger breakdown.',
    feeCents: 7500, // illustrative, single source of truth
  },
] as const

export type StudyTypeKey = (typeof STUDY_TYPES)[number]['key']
