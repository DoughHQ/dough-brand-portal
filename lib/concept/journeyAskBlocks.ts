import { editableVerificationOptions } from './templateConfig'
import {
  BATTLE_PROMPT_OPTIONS,
  type BattlePromptCode,
} from './singleTest'
import type { ConceptStudyDraft } from './types'
import type { AskedBlock, JourneyAskScreen } from './journeyAccordion'

export const WHAT_MATTERS_PROMPT =
  'When you look at the package, which matters most to you, and which matters least?'

export const WHAT_MATTERS_ITEMS = [
  'Looks tasty',
  'Easy to tell what it is',
  'Looks high quality',
  'Looks like good value',
  'Stands out',
  'What it says on the front',
  'The colors and design',
]

export const FREQUENCY_OPTIONS = [
  'Never',
  'A few times a year',
  'About once a month',
  '2-3 times a month',
  'Weekly or more',
]

export const BRAND_SCREENER_PROMPT =
  'Which of these have you bought in the last 3 months? Select all that apply.'

export const FIRST_LOOK_PROMPT = 'First impression: how do you feel about this one?'

export const FIRST_LOOK_OPTIONS = [
  'Love it',
  'Like it',
  "It's okay",
  "Don't like it",
  "Really don't like it",
]

export const WHY_PROMPT = 'What made you pick this one?'

export const WHY_ITEMS = [...WHAT_MATTERS_ITEMS, 'I know this brand']

export const RANK_PROMPT = 'Put them in order, your favorite at the top.'

export const OPEN_TEXT_PROMPT = "Anything else you'd like the brand to know? (optional)"

export const WOULDNT_BUY = "I wouldn't buy it"

export function choiceLabels(raw: unknown): string[] {
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

export function screensOf(
  screens: ReadonlyArray<JourneyAskScreen> | null | undefined,
  kind: string
): JourneyAskScreen[] {
  return (screens ?? []).filter((screen) => screen.kind === kind)
}

export function stripOptional(prompt: string): string {
  return prompt.replace(/\s*\(optional\)\s*$/i, '').trim()
}

export function frequencyPrompt(draft: ConceptStudyDraft): string {
  const plural = draft.templateConfig.category_plural.trim()
  return plural ? `How often do you buy ${plural}?` : 'How often do you buy this?'
}

export function frequencyBlock(
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

export function brandChecklist(draft: ConceptStudyDraft): string[] {
  const brands = editableVerificationOptions(draft.templateConfig).map((option) => option.label)
  const decoy = draft.templateConfig.decoy_option.trim()
  return [...brands, ...(decoy ? [decoy] : []), 'None of these']
}

export function brandScreenerBlock(
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

export function battleSentence(draft: ConceptStudyDraft): string {
  const custom = (draft.customBattlePrompt ?? '').trim()
  if (custom) return custom
  const code = (draft.battlePromptCode ?? 'CONCEPT_BATTLE_BUY') as BattlePromptCode
  return BATTLE_PROMPT_OPTIONS.find((opt) => opt.code === code)?.prompt ?? 'Which one would you buy?'
}
