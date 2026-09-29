/**
 * Draft + wire extras for CONCEPT_CORE_V1 (flag on only).
 * Kept separate from PackagingTemplateConfig so flag-off paths stay clean.
 */

export const MODULE_CONCEPT_CORE_V1 = 'CONCEPT_CORE_V1' as const

export const BATTLE_PROMPT_CODES = [
  'CONCEPT_BATTLE_BUY',
  'CONCEPT_BATTLE_LOOKS_BEST',
  'CONCEPT_BATTLE_TRY',
  'CONCEPT_BATTLE_EYE',
] as const

export type BattlePromptCode = (typeof BATTLE_PROMPT_CODES)[number]

export const BATTLE_PROMPT_OPTIONS: {
  code: BattlePromptCode
  label: string
  prompt: string
}[] = [
  {
    code: 'CONCEPT_BATTLE_BUY',
    label: 'Would buy',
    prompt: 'Which one would you buy?',
  },
  {
    code: 'CONCEPT_BATTLE_LOOKS_BEST',
    label: 'Looks best',
    prompt: 'Which one looks best?',
  },
  {
    code: 'CONCEPT_BATTLE_TRY',
    label: 'Would try',
    prompt: 'Which one would you try?',
  },
  {
    code: 'CONCEPT_BATTLE_EYE',
    label: 'Catches the eye',
    prompt: 'Which one catches your eye?',
  },
]


export type BrandQuestionDraft = {
  localId: string
  prompt: string
  options: string[]
  max_select: number
}

/** Per-bar UI state — wire: absent | null | value */
export type SuccessBarState<T> =
  | { kind: 'default' }
  | { kind: 'off' }
  | { kind: 'custom'; value: T }

export type LikingMode = 'vs_current_pack' | 'absolute' | 'off'

export type SuccessBarsDraft = {
  h2h: SuccessBarState<number>
  price: SuccessBarState<number>
  likingMode: SuccessBarState<LikingMode>
  /** Required when likingMode is custom absolute */
  likingThreshold: SuccessBarState<number>
}

export function defaultSuccessBarsDraft(): SuccessBarsDraft {
  return {
    h2h: { kind: 'default' },
    price: { kind: 'default' },
    likingMode: { kind: 'default' },
    likingThreshold: { kind: 'default' },
  }
}

export function emptyBrandQuestion(): BrandQuestionDraft {
  return {
    localId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `bq-${Date.now()}`,
    prompt: '',
    options: ['', ''],
    max_select: 1,
  }
}

/** Prefill decoy — not a real brand; check_concept_decoy still validates. */
export const DEFAULT_DECOY_OPTION = 'Frostline'

/**
 * Build success_bars wire object.
 * Each key: omitted (default), null (off), or value (custom).
 */
export function successBarsToWire(
  bars: SuccessBarsDraft
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {}

  if (bars.h2h.kind === 'off') out.h2h_min_win_share = null
  else if (bars.h2h.kind === 'custom') out.h2h_min_win_share = bars.h2h.value

  if (bars.price.kind === 'off') out.price_min_share_at_anchor = null
  else if (bars.price.kind === 'custom') {
    out.price_min_share_at_anchor = bars.price.value
  }

  if (bars.likingMode.kind === 'off') {
    out.liking_mode = 'off'
  } else if (bars.likingMode.kind === 'custom') {
    out.liking_mode = bars.likingMode.value
    if (bars.likingMode.value === 'absolute') {
      if (bars.likingThreshold.kind === 'custom') {
        out.liking_threshold = bars.likingThreshold.value
      }
    } else if (bars.likingMode.value === 'vs_current_pack') {
      if (bars.likingThreshold.kind === 'custom') {
        out.liking_threshold = bars.likingThreshold.value
      } else if (bars.likingThreshold.kind === 'off') {
        out.liking_threshold = null
      }
    }
  } else if (bars.likingThreshold.kind === 'custom') {
    out.liking_threshold = bars.likingThreshold.value
  } else if (bars.likingThreshold.kind === 'off') {
    out.liking_threshold = null
  }

  return Object.keys(out).length > 0 ? out : undefined
}

export function brandQuestionsToWire(
  questions: BrandQuestionDraft[]
): Array<{ prompt: string; options: string[]; max_select?: number }> {
  return questions
    .map((q) => {
      const prompt = q.prompt.trim()
      const options = q.options.map((o) => o.trim()).filter(Boolean)
      const max_select = Math.max(1, Math.min(options.length, q.max_select || 1))
      return { prompt, options, ...(max_select > 1 ? { max_select } : {}) }
    })
    .filter((q) => q.prompt.length >= 8 && q.options.length >= 2)
}
