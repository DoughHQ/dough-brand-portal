import { respondentDesignLabel } from './designLetters'
import type { ConceptJourney } from './journey'
import { normalizeExpectedPrice } from './priceBands'
import {
  BATTLE_PROMPT_OPTIONS,
  type BattlePromptCode,
  type BrandQuestionDraft,
  defaultSuccessBarsDraft,
  type SuccessBarsDraft,
} from './singleTest'
import { editableVerificationOptions, previewPriceBands } from './templateConfig'
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

/**
 * Each screener is one screen when the preview reports the pair.
 * Any other count stays blank rather than splitting a number the journey did not give.
 */
export function pairedScreenerCountLabel(counts: Counts | null | undefined): string | null {
  if (!counts || counts.screeners !== 2) return null
  return '1 screen'
}

/** The follow-up after a pick. The preview reports an upper bound, not a fixed count. */
export function whyFollowupCountLabel(counts: Counts | null | undefined): string | null {
  if (!counts) return null
  const n = counts.why_followups_up_to
  if (n == null || !Number.isFinite(n) || n <= 0) return null
  return n === 1 ? 'Up to 1 screen' : `Up to ${n} screens`
}

/** Blank until the preview returns a count. Never a guessed number. */
export function journeyStepCountLabel(id: JourneyStepId, counts: Counts | null | undefined): string | null {
  if (!journeyStepCountsAsScreen(id) || !counts) return null
  const n = countFor(id, counts)
  if (n == null || !Number.isFinite(n)) return null
  return n === 1 ? '1 screen' : `${n} screens`
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

function brandQuestionReady(question: { prompt: string; options: string[] }): boolean {
  const prompt = question.prompt.trim()
  const options = question.options.map((option) => option.trim()).filter(Boolean)
  return prompt.length >= 8 && options.length >= 2
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
    return (draft.brandQuestions ?? []).every(brandQuestionReady)
  }
  return barsReady(draft.successBars ?? defaultSuccessBarsDraft())
}

export type JourneyClosedLine =
  | { kind: 'question'; text: string }
  | { kind: 'required' }
  | { kind: 'empty' }
  | { kind: 'status'; text: string }

export type AskedBlock = {
  prompt: string
  items: string[]
  note?: string
  /** Empty response, for the closing note. */
  blank?: boolean
}

export type JourneyAskScreen = {
  kind: string
  prompt?: string
  options?: unknown
  items?: unknown
  bands?: unknown
}

const WHAT_MATTERS_PROMPT =
  'When you look at the package, which matters most to you, and which matters least?'

const WHAT_MATTERS_ITEMS = [
  'Looks tasty',
  'Easy to tell what it is',
  'Looks high quality',
  'Looks like good value',
  'Stands out',
  'What it says on the front',
  'The colors and design',
]

const FREQUENCY_OPTIONS = [
  'Never',
  'A few times a year',
  'About once a month',
  '2-3 times a month',
  'Weekly or more',
]

const BRAND_SCREENER_PROMPT =
  'Which of these have you bought in the last 3 months? Select all that apply.'

const FIRST_LOOK_PROMPT = 'First impression: how do you feel about this one?'

const FIRST_LOOK_OPTIONS = [
  'Love it',
  'Like it',
  "It's okay",
  "Don't like it",
  "Really don't like it",
]

const WHY_PROMPT = 'What made you pick this one?'

const WHY_ITEMS = [...WHAT_MATTERS_ITEMS, 'I know this brand']

const RANK_PROMPT = 'Put them in order, your favorite at the top.'

const OPEN_TEXT_PROMPT = "Anything else you'd like the brand to know? (optional)"

const WOULDNT_BUY = "I wouldn't buy it"

function choiceLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item.trim())
      continue
    }
    if (item && typeof item === 'object' && 'label' in item) {
      const label = (item as { label?: unknown }).label
      if (typeof label === 'string' && label.trim()) out.push(label.trim())
    }
  }
  return out
}

function screensOf(
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined,
  kind: string
): JourneyAskScreen[] {
  return (screens ?? []).filter((screen) => screen.kind === kind)
}

function stripOptional(prompt: string): string {
  return prompt.replace(/\s*\(optional\)\s*$/i, '').trim()
}

function frequencyPrompt(draft: ConceptStudyDraft): string {
  const plural = draft.templateConfig.category_plural.trim()
  return plural ? `How often do you buy ${plural}?` : 'How often do you buy this?'
}

function frequencyBlock(
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): AskedBlock {
  const found =
    screensOf(screens, 'screener').find((screen) =>
      (screen.prompt ?? '').trim().toLowerCase().startsWith('how often')
    ) ?? screensOf(screens, 'screener')[0]
  const items = choiceLabels(found?.options)
  return {
    prompt: found?.prompt?.trim() || frequencyPrompt(draft),
    items: items.length > 0 ? items : FREQUENCY_OPTIONS,
  }
}

function brandChecklist(draft: ConceptStudyDraft): string[] {
  const brands = editableVerificationOptions(draft.templateConfig).map((option) => option.label)
  const decoy = draft.templateConfig.decoy_option.trim()
  return [...brands, ...(decoy ? [decoy] : []), 'None of these']
}

function brandScreenerBlock(
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): AskedBlock {
  const found = screensOf(screens, 'screener').find(
    (screen) => !(screen.prompt ?? '').trim().toLowerCase().startsWith('how often')
  )
  const items = choiceLabels(found?.options)
  return {
    prompt: found?.prompt?.trim() || BRAND_SCREENER_PROMPT,
    items: items.length > 0 ? items : brandChecklist(draft),
  }
}

function battleSentence(draft: ConceptStudyDraft): string {
  const custom = (draft.customBattlePrompt ?? '').trim()
  if (custom) return custom
  const code = (draft.battlePromptCode ?? 'CONCEPT_BATTLE_BUY') as BattlePromptCode
  return BATTLE_PROMPT_OPTIONS.find((opt) => opt.code === code)?.prompt ?? 'Which one would you buy?'
}

/** The question after a pick, and the reasons. */
export function whyFollowupAsked(
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): AskedBlock {
  return whyBlock(screens)
}

function whyBlock(screens: ReadonlyArray<JourneyAskScreen> | null | undefined): AskedBlock {
  const found = screensOf(screens, 'why_followups')[0]
  const items = choiceLabels(found?.options)
  return {
    prompt: found?.prompt?.trim() || WHY_PROMPT,
    items: items.length > 0 ? items : WHY_ITEMS,
    note: 'After each pick.',
  }
}

function firstLookBlock(screens: ReadonlyArray<JourneyAskScreen> | null | undefined): AskedBlock {
  const found = screensOf(screens, 'rating')[0]
  const items = choiceLabels(found?.options)
  return {
    prompt: found?.prompt?.trim() || FIRST_LOOK_PROMPT,
    items: items.length > 0 ? items : FIRST_LOOK_OPTIONS,
    note: 'Once for each design.',
  }
}

/** Draft order. Letters match shoppers and the report. */
function rankStack(draft: ConceptStudyDraft): string[] {
  const designs = draft.conceptArms.map((_, index) => respondentDesignLabel(index))
  const competitors = draft.products.flatMap((product) => {
    if (product.product_id == null) return []
    const name = product.frozen_display_name.trim() || product.frozen_brand_name.trim()
    return name ? [name] : []
  })
  return [...designs, ...competitors]
}

function rankBlock(
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): AskedBlock {
  const found = screensOf(screens, 'rank')[0]
  return {
    prompt: found?.prompt?.trim() || RANK_PROMPT,
    items: rankStack(draft),
  }
}

function pricePrompt(
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): string {
  const fromJourney = screensOf(screens, 'price')[0]?.prompt?.trim()
  if (fromJourney) return fromJourney
  const pack = draft.templateConfig.pack_size.trim()
  return pack ? `How much would you pay for a ${pack} of this?` : 'How much would you pay for this?'
}

function priceItems(
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): string[] {
  const fromJourney = choiceLabels(screensOf(screens, 'price')[0]?.bands)
  if (fromJourney.length > 0) return fromJourney
  const local = previewPriceBands(draft.templateConfig)
  if (local.length === 0) return []
  return [...local, WOULDNT_BUY]
}

function openTextBlock(screens: ReadonlyArray<JourneyAskScreen> | null | undefined): AskedBlock {
  const found = screensOf(screens, 'open_text')[0]
  return {
    prompt: found?.prompt?.trim() || OPEN_TEXT_PROMPT,
    items: [],
    blank: true,
  }
}

/** The what-matters question. Journey items win when the preview has them. */
export function whatMattersAsked(
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): { prompt: string; items: string[] } {
  const screen = screensOf(screens, 'maxdiff')[0]
  const fromJourney = choiceLabels(screen?.items)
  return {
    prompt: screen?.prompt?.trim() || WHAT_MATTERS_PROMPT,
    items: fromJourney.length > 0 ? fromJourney : WHAT_MATTERS_ITEMS,
  }
}

/** Question, then the choices, for the open row. */
export function journeyAsked(
  id: JourneyStepId,
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): AskedBlock[] {
  switch (id) {
    case 'screeners':
      return [frequencyBlock(draft, screens), brandScreenerBlock(draft, screens)]
    case 'first_look':
      return [firstLookBlock(screens)]
    case 'battles':
      return [{ prompt: battleSentence(draft), items: [] }, whyBlock(screens)]
    case 'what_matters': {
      const asked = whatMattersAsked(screens)
      return [{ prompt: asked.prompt, items: asked.items }]
    }
    case 'rank':
      return [rankBlock(draft, screens)]
    case 'price':
      return [{ prompt: pricePrompt(draft, screens), items: priceItems(draft, screens) }]
    case 'brand_questions':
      return (draft.brandQuestions ?? [])
        .filter((question) => question.prompt.trim().length > 0)
        .map((question) => ({
          prompt: question.prompt.trim(),
          items: question.options.map((option) => option.trim()).filter(Boolean),
        }))
    case 'open_text':
      return [openTextBlock(screens)]
    case 'success':
      return []
  }
}

function questionText(
  id: JourneyStepId,
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): string {
  switch (id) {
    case 'screeners':
      return brandScreenerBlock(draft, screens).prompt
    case 'first_look':
      return firstLookBlock(screens).prompt
    case 'battles':
      return battleSentence(draft)
    case 'what_matters':
      return whatMattersAsked(screens).prompt
    case 'rank':
      return rankBlock(draft, screens).prompt
    case 'price':
      return pricePrompt(draft, screens)
    case 'open_text':
      return stripOptional(openTextBlock(screens).prompt)
    default:
      return ''
  }
}

/** One brand question, closed on the prompt shoppers will read. */
export function brandQuestionClosedLine(question: BrandQuestionDraft): JourneyClosedLine {
  const prompt = question.prompt.trim()
  if (!brandQuestionReady(question) || !prompt) return { kind: 'required' }
  return { kind: 'question', text: prompt }
}

/**
 * One screen per question, only when the preview count matches the draft.
 * A mismatch stays blank rather than showing a number the journey did not return.
 */
export function brandQuestionScreenLabel(
  questionCount: number,
  counts: Counts | null | undefined
): string | null {
  if (!counts || questionCount <= 0) return null
  const n = counts.brand_questions
  if (n == null || !Number.isFinite(n) || n !== questionCount) return null
  return '1 screen'
}

/** The closed-row line: the question respondents read, or the required dot. */
export function journeyClosedLine(
  id: JourneyStepId,
  draft: ConceptStudyDraft,
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined
): JourneyClosedLine {
  if (id === 'success') {
    const bars = draft.successBars ?? defaultSuccessBarsDraft()
    const custom =
      bars.h2h.kind === 'custom' ||
      bars.price.kind === 'custom' ||
      bars.likingMode.kind === 'custom'
    return { kind: 'status', text: custom ? 'Your thresholds' : 'Dough defaults' }
  }
  if (id === 'brand_questions') {
    const questions = draft.brandQuestions ?? []
    if (questions.length === 0) return { kind: 'empty' }
    if (!journeyStepDone(id, draft)) return { kind: 'required' }
    const prompt = questions.find((question) => question.prompt.trim())?.prompt.trim() ?? ''
    return prompt ? { kind: 'question', text: prompt } : { kind: 'required' }
  }
  if (journeyStepOwned(id) && !journeyStepDone(id, draft)) return { kind: 'required' }
  return { kind: 'question', text: questionText(id, draft, screens) }
}

/** The first step the brand still has to fill. Null when those steps are done. */
export function firstUnfinishedJourneyStep(draft: ConceptStudyDraft): JourneyStepId | null {
  for (const id of OWNED_UNFINISHED_ORDER) {
    if (!journeyStepDone(id, draft)) return id
  }
  return null
}
