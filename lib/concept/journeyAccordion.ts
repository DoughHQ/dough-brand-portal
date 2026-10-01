import type { ConceptJourney } from './journey'
import { formatPriceDisplay, normalizeExpectedPrice } from './priceBands'
import {
  BATTLE_PROMPT_OPTIONS,
  type BattlePromptCode,
  defaultSuccessBarsDraft,
  type SuccessBarsDraft,
} from './singleTest'
import { editableVerificationOptions } from './templateConfig'
import type { ConceptStudyDraft } from './types'

export const JOURNEY_STEP_IDS = [
  'screeners',
  'first_look',
  'battles',
  'what_matters',
  'rank',
  'price',
  'brand_questions',
  'open_text',
  'success',
] as const

export type JourneyStepId = (typeof JOURNEY_STEP_IDS)[number]

const OWNED_UNFINISHED_ORDER: JourneyStepId[] = [
  'screeners',
  'battles',
  'price',
  'brand_questions',
  'success',
]

export function isJourneyStepId(value: string): value is JourneyStepId {
  return (JOURNEY_STEP_IDS as readonly string[]).includes(value)
}

export function journeyStepOwned(id: JourneyStepId): boolean {
  return OWNED_UNFINISHED_ORDER.includes(id)
}

/** Success bars are the brand's, not a respondent screen. */
export function journeyStepCountsAsScreen(id: JourneyStepId): boolean {
  return id !== 'success'
}

type Counts = ConceptJourney['counts']

function countFor(id: JourneyStepId, counts: Counts): number | undefined {
  switch (id) {
    case 'screeners':
      return counts.screeners
    case 'first_look':
      return counts.first_look
    case 'battles':
      return counts.battles
    case 'what_matters':
      return counts.maxdiff_sets
    case 'rank':
      return counts.rank
    case 'price':
      return counts.price
    case 'brand_questions':
      return counts.brand_questions
    case 'open_text':
      return counts.open_text
    case 'success':
      return undefined
  }
}

/** Blank until the preview returns a count. Never a guessed number. */
export function journeyStepCountLabel(id: JourneyStepId, counts: Counts | null | undefined): string | null {
  if (!journeyStepCountsAsScreen(id) || !counts) return null
  const n = countFor(id, counts)
  if (n == null || !Number.isFinite(n)) return null
  if (id === 'what_matters') return n === 1 ? '1 set' : `${n} sets`
  return n === 1 ? '1 screen' : `${n} screens`
}

function battleLabel(draft: ConceptStudyDraft): string {
  const custom = (draft.customBattlePrompt ?? '').trim()
  if (custom) return custom.length > 48 ? `${custom.slice(0, 48)}…` : custom
  const code = (draft.battlePromptCode ?? 'CONCEPT_BATTLE_BUY') as BattlePromptCode
  return BATTLE_PROMPT_OPTIONS.find((opt) => opt.code === code)?.label ?? 'Would buy'
}

function customPromptReady(text: string): boolean {
  return text.length >= 8 && text.length <= 120 && text.endsWith('?')
}

/** Shown under a custom battle prompt. Null when the brand is using a vetted prompt. */
export function customBattlePromptNote(text: string): { ok: boolean; message: string } | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (customPromptReady(trimmed)) {
    return { ok: true, message: 'Respondents see this prompt.' }
  }
  return { ok: false, message: 'Must be 8–120 characters and end with ?' }
}

function barsReady(bars: SuccessBarsDraft): boolean {
  const values = [bars.h2h, bars.price, bars.likingThreshold]
  return values.every((state) => state.kind !== 'custom' || Number.isFinite(state.value))
}

export function journeyStepDone(id: JourneyStepId, draft: ConceptStudyDraft): boolean {
  if (!journeyStepOwned(id)) return false
  if (id === 'screeners') {
    return editableVerificationOptions(draft.templateConfig).length >= 2
  }
  if (id === 'battles') {
    const custom = (draft.customBattlePrompt ?? '').trim()
    if (custom) return customPromptReady(custom)
    return Boolean(draft.battlePromptCode ?? 'CONCEPT_BATTLE_BUY')
  }
  if (id === 'price') {
    const anchor = normalizeExpectedPrice(draft.templateConfig.expected_price)
    return Boolean(anchor) && Number(anchor) > 0
  }
  if (id === 'brand_questions') {
    const questions = draft.brandQuestions ?? []
    return questions.every((q) => {
      const prompt = q.prompt.trim()
      const options = q.options.map((o) => o.trim()).filter(Boolean)
      return prompt.length >= 8 && options.length >= 2
    })
  }
  return barsReady(draft.successBars ?? defaultSuccessBarsDraft())
}

export function journeyStepSummary(id: JourneyStepId, draft: ConceptStudyDraft): string {
  if (!journeyStepOwned(id)) return 'Set by Dough'
  if (id === 'screeners') {
    const n = editableVerificationOptions(draft.templateConfig).length
    return n >= 2 ? `${n} brands` : 'Needs two brands'
  }
  if (id === 'battles') return battleLabel(draft)
  if (id === 'price') {
    const anchor = normalizeExpectedPrice(draft.templateConfig.expected_price)
    if (!anchor || Number(anchor) <= 0) return 'Needs a price'
    return formatPriceDisplay(anchor)
  }
  if (id === 'brand_questions') {
    const questions = draft.brandQuestions ?? []
    if (questions.length === 0) return 'None'
    if (!journeyStepDone(id, draft)) return 'Needs a prompt'
    return `${questions.length} of 2`
  }
  const bars = draft.successBars ?? defaultSuccessBarsDraft()
  const custom =
    bars.h2h.kind === 'custom' ||
    bars.price.kind === 'custom' ||
    bars.likingMode.kind === 'custom'
  return custom ? 'Custom bars' : 'Dough defaults'
}

/** The first step the brand still has to fill. Null when those steps are done. */
export function firstUnfinishedJourneyStep(draft: ConceptStudyDraft): JourneyStepId | null {
  for (const id of OWNED_UNFINISHED_ORDER) {
    if (!journeyStepDone(id, draft)) return id
  }
  return null
}
