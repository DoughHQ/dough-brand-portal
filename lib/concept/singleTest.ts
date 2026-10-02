/**
 * Draft + wire extras for CONCEPT_CORE_V1 (flag on only).
 * Kept separate from PackagingTemplateConfig so flag-off paths stay clean.
 */

import { respondentDesignLabel } from './designLetters'

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
  /**
   * Where answer labels come from. Default / omitted = write your own.
   * `field` locks options to the current concept + competitor seats.
   */
  answerSource?: BrandQuestionAnswerSource
  /** Free-text answers parked while answerSource is `field`. */
  customOptionsStash?: string[]
}

/** How answer options are authored. */
export type BrandQuestionAnswerSource = 'custom' | 'field'

/** How shoppers answer. Wire uses max_select: 1 vs all options. */
export type BrandQuestionKind = 'pick_one' | 'pick_several'

export const BRAND_QUESTION_STARTERS = [
  'Which looks most premium?',
  'Which would you buy?',
  'Which feels most like your brand?',
] as const

export function brandQuestionAnswerSource(
  question: BrandQuestionDraft
): BrandQuestionAnswerSource {
  return question.answerSource === 'field' ? 'field' : 'custom'
}

export function brandQuestionKind(question: BrandQuestionDraft): BrandQuestionKind {
  return question.max_select > 1 ? 'pick_several' : 'pick_one'
}

export function brandQuestionTypeLabel(question: BrandQuestionDraft): string {
  return brandQuestionKind(question) === 'pick_several' ? 'Pick several' : 'Pick one'
}

export function withBrandQuestionKind(
  question: BrandQuestionDraft,
  kind: BrandQuestionKind
): BrandQuestionDraft {
  if (kind === 'pick_one') return { ...question, max_select: 1 }
  return { ...question, max_select: Math.max(2, question.options.length) }
}

/** Keep pick-several max_select aligned with the answer list as options change. */
export function withBrandQuestionOptions(
  question: BrandQuestionDraft,
  options: string[]
): BrandQuestionDraft {
  const next = { ...question, options }
  if (brandQuestionKind(question) === 'pick_one') return next
  return { ...next, max_select: Math.max(2, options.length) }
}

/**
 * Labels for Choose-from-field mode — same seat order as ranking:
 * design letters (with operator name when set), then resolved competitors.
 */
export type FieldAnswerSeat = {
  label: string
  /** Concept stimuli storage path (signed at render). */
  imageRef?: string | null
  /** Competitor catalog image URL. */
  imageSrc?: string | null
}

export function fieldAnswerOptionSeats(input: {
  conceptArms: ReadonlyArray<{ display_name: string; image_url?: string | null }>
  products: ReadonlyArray<{
    product_id: number | null
    frozen_display_name: string
    frozen_brand_name: string
    frozen_image_url?: string | null
  }>
}): FieldAnswerSeat[] {
  const designs = input.conceptArms.map((arm, index) => {
    const letter = respondentDesignLabel(index)
    const name = arm.display_name.trim()
    return {
      label: name ? `${letter} — ${name}` : letter,
      imageRef: arm.image_url ?? null,
      imageSrc: null,
    }
  })
  const competitors = input.products.flatMap((product) => {
    if (product.product_id == null) return []
    const name = product.frozen_display_name.trim()
    const brand = product.frozen_brand_name.trim()
    const label =
      name && brand && brand.toLowerCase() !== name.toLowerCase()
        ? `${brand} — ${name}`
        : name || brand
    if (!label) return []
    return [
      {
        label,
        imageRef: null,
        imageSrc: product.frozen_image_url ?? null,
      },
    ]
  })
  return [...designs, ...competitors]
}

export function fieldAnswerOptionLabels(input: {
  conceptArms: ReadonlyArray<{ display_name: string; image_url?: string | null }>
  products: ReadonlyArray<{
    product_id: number | null
    frozen_display_name: string
    frozen_brand_name: string
    frozen_image_url?: string | null
  }>
}): string[] {
  return fieldAnswerOptionSeats(input).map((seat) => seat.label)
}

function sameOptionList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value, i) => value === b[i])
}

/** Switch answer authoring mode; stash / restore free-text so the toggle is reversible. */
export function withBrandQuestionAnswerSource(
  question: BrandQuestionDraft,
  source: BrandQuestionAnswerSource,
  fieldOptions: string[]
): BrandQuestionDraft {
  const current = brandQuestionAnswerSource(question)
  if (current === source) {
    if (source === 'field' && !sameOptionList(question.options, fieldOptions)) {
      return withBrandQuestionOptions(
        { ...question, answerSource: 'field' },
        fieldOptions
      )
    }
    return question
  }
  if (source === 'field') {
    return withBrandQuestionOptions(
      {
        ...question,
        answerSource: 'field',
        customOptionsStash: question.options,
      },
      fieldOptions
    )
  }
  const restored = question.customOptionsStash
  const options =
    restored && restored.length >= 2 ? restored : ['', '']
  const { customOptionsStash: _drop, ...rest } = question
  return withBrandQuestionOptions(
    { ...rest, answerSource: 'custom', customOptionsStash: undefined },
    options
  )
}

/** Keep field-mode options aligned with the live field. */
export function syncBrandQuestionFieldOptions(
  question: BrandQuestionDraft,
  fieldOptions: string[]
): BrandQuestionDraft {
  if (brandQuestionAnswerSource(question) !== 'field') return question
  if (sameOptionList(question.options, fieldOptions)) return question
  return withBrandQuestionOptions(question, fieldOptions)
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
    // Concept has no current pack — liking stays off until absolute bars land.
    likingMode: { kind: 'off' },
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

const DOUGH_SHARE_DEFAULT = 0.5

/** Percent for a share bar. Null when the bar is off. */
export function successSharePercent(
  state: SuccessBarState<number>,
  doughDefault = DOUGH_SHARE_DEFAULT
): number | null {
  if (state.kind === 'off') return null
  if (state.kind === 'default') return Math.round(doughDefault * 100)
  return Math.round(state.value * 100)
}

export function headToHeadWinSentence(state: SuccessBarState<number>): string {
  const pct = successSharePercent(state)
  if (pct == null) return 'Head-to-head is off for the verdict.'
  return `You win the field when you take at least ${pct}% of head-to-heads.`
}

/**
 * priceLabel is the formatted anchor ("$7.99") when the brand has set one.
 */
export function priceWinSentence(
  state: SuccessBarState<number>,
  priceLabel: string | null | undefined
): string {
  const pct = successSharePercent(state)
  if (pct == null) return 'Price is off for the verdict.'
  const price = (priceLabel ?? '').trim()
  if (price) {
    return `You win on price when at least ${pct}% say they would pay ${price} or more.`
  }
  return `You win on price when at least ${pct}% say they would pay your price or more.`
}

export function likingWinSentence(
  likingMode: SuccessBarState<LikingMode>
): string {
  if (likingMode.kind === 'off') return 'Liking is off for the verdict.'
  if (likingMode.kind === 'custom' && likingMode.value === 'absolute') {
    return 'You win on liking when enough shoppers put it in the top two on first look.'
  }
  return 'Liking is off for the verdict.'
}

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

  // Concept verdicts are field + price. Never send vs_current_pack.
  out.liking_mode = 'off'

  return out
}

export function brandQuestionsToWire(
  questions: BrandQuestionDraft[]
): Array<{ prompt: string; options: string[]; max_select?: number }> {
  return questions
    .map((q) => {
      const prompt = q.prompt.trim()
      const options = q.options.map((o) => o.trim()).filter(Boolean)
      if (prompt.length < 8 || options.length < 2) return null
      // Pick several → every answer is allowed. Pick one → omit max_select (defaults to 1).
      if (brandQuestionKind(q) === 'pick_several') {
        return { prompt, options, max_select: options.length }
      }
      return { prompt, options }
    })
    .filter((q): q is { prompt: string; options: string[]; max_select?: number } => q != null)
}
