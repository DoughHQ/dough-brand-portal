/**
 * Dough in-home method — locked journey + brand-editable knobs.
 * Source of truth for copy: docs/ihut/ihut-method-APPROVED-2026-10-03.md
 */

import {
  emptyBrandQuestion,
  type BrandQuestionDraft,
  type FieldAnswerSeat,
} from '@/lib/concept/singleTest'
import { isResolvedBoxSeat } from './fieldSize'
import type { BoxFieldRow, BoxStudyDraft } from './types'

export const IHUT_SHELF_BATTLE_PROMPT = 'Which would you pick up?'
export const IHUT_TASTE_BATTLE_PROMPT = 'Which did you enjoy more?'
export const IHUT_BUY_ORDER_PROMPT = "Put them in the order you'd buy them"

/** Same wire shape as concept — 0–2 pick-one / pick-several questions. */
export type IhutBrandQuestionDraft = BrandQuestionDraft

export const IHUT_BRAND_QUESTION_STARTERS = [
  'Which would you buy again?',
  'Which packaging is easiest to use?',
  'Which tastes most like something you’d keep buying?',
] as const

export const IHUT_GENERIC_ATTRIBUTES = [
  { value: 'sweetness', label: 'Sweetness' },
  { value: 'saltiness', label: 'Saltiness' },
  { value: 'texture', label: 'Texture' },
  { value: 'flavor_strength', label: 'Flavor strength' },
] as const

export type IhutAttributeCode = (typeof IHUT_GENERIC_ATTRIBUTES)[number]['value']

export const IHUT_DEFAULT_ATTRIBUTES: IhutAttributeCode[] = [
  'sweetness',
  'saltiness',
  'flavor_strength',
]

export type IhutSuccessBarsDraft = {
  /** Taste battle win share for your product (0–1). */
  tasteWinShare: number
  /** Share who top-box liking on your product (0–1). */
  likingShare: number
  /** Share who'd buy your product at shelf price (0–1). */
  buyAtPriceShare: number
}

export const IHUT_DEFAULT_SUCCESS_BARS: IhutSuccessBarsDraft = {
  tasteWinShare: 0.5,
  likingShare: 0.5,
  buyAtPriceShare: 0.5,
}

export type IhutJourneyStep = {
  id: string
  title: string
  prompt: string | null
  measures: string
  options?: string[]
  note?: string
  /** Brand can edit this row. */
  editable?: 'attributes' | 'brand_questions' | 'success_bars'
  day2?: boolean
}

/** Read-only Day 1 method preview. Attributes / brand Qs / bars expand in the UI. */
export const IHUT_DAY1_JOURNEY: readonly IhutJourneyStep[] = [
  {
    id: 'shelf_battles',
    title: 'Battles',
    prompt: IHUT_SHELF_BATTLE_PROMPT,
    measures: 'Packaging — pack strength',
    note: 'Unopened packs in hand. Every pair at ≤4 products; 6 rotated pairs at 5.',
  },
  {
    id: 'expectation',
    title: 'Expectation',
    prompt: 'How good do you expect it to taste?',
    measures: 'Packaging — the promise',
    options: ['Amazing', 'Good', 'Okay', 'Not great', 'Bad'],
    note: 'One tap per product, before anything is opened.',
  },
  {
    id: 'try_each',
    title: 'Try each product',
    prompt: null,
    measures: 'Open · liking · attribute checks',
    note: 'Assigned tasting order. Scan first, then open, like, and up to 3 just-right checks.',
    editable: 'attributes',
  },
  {
    id: 'taste_battles',
    title: 'Taste battles',
    prompt: IHUT_TASTE_BATTLE_PROMPT,
    measures: 'Taste — taste strength',
    note: 'After everything has been tried. Sampled follow-up: “What made the difference?”',
  },
  {
    id: 'buy_order',
    title: 'Buy order',
    prompt: IHUT_BUY_ORDER_PROMPT,
    measures: 'Preference / purchase',
  },
  {
    id: 'price_check',
    title: 'Price check',
    prompt: 'At $X, would you buy it?',
    measures: 'Purchase at price',
    options: ['Yes', 'Maybe', 'No'],
    note: 'Runs only when every seat has a shelf price.',
  },
  {
    id: 'best_worst',
    title: 'Best and worst',
    prompt: null,
    measures: 'Diagnostics',
    note: 'Short open text on the favorite and least favorite from buy order.',
  },
  {
    id: 'brand_questions',
    title: 'Your questions',
    prompt: null,
    measures: 'Brand-written · reviewed by Dough',
    editable: 'brand_questions',
    note: '0–2 closed questions, asked last so they can’t color the core.',
  },
  {
    id: 'success_bars',
    title: 'Success bars',
    prompt: null,
    measures: 'Your go / no-go thresholds',
    editable: 'success_bars',
  },
]

export const IHUT_DAY2_JOURNEY: readonly IhutJourneyStep[] = [
  {
    id: 'amount_left',
    title: 'How much is left?',
    prompt: 'How much is left?',
    measures: 'Behavior — what they finished',
    options: ['None', 'A little', 'Most', 'All'],
    day2: true,
  },
  {
    id: 'grown_on_you',
    title: 'Grown on you?',
    prompt: 'Has it grown on you?',
    measures: 'Taste over time',
    options: ['Better than day 1', 'About the same', 'Worse than day 1'],
    day2: true,
  },
  {
    id: 'pack_after_use',
    title: 'Packaging after a few days',
    prompt: 'How has the packaging held up?',
    measures: 'Packaging in use',
    options: ['Fine', 'Annoying', 'Failed'],
    note: 'Skipped when the box runs taste-only.',
    day2: true,
  },
  {
    id: 'still_pick',
    title: 'Still your pick?',
    prompt: 'Which would you buy again?',
    measures: 'Preference hold',
    day2: true,
  },
  {
    id: 'price_check_day2',
    title: 'Price check again',
    prompt: 'At $X, would you buy it?',
    measures: 'Purchase at price · change since Day 1',
    options: ['Yes', 'Maybe', 'No'],
    day2: true,
  },
  {
    id: 'one_thing',
    title: 'One thing',
    prompt: 'What would make you buy it again?',
    measures: 'Diagnostics',
    day2: true,
  },
]

export function emptyIhutBrandQuestion(): IhutBrandQuestionDraft {
  return emptyBrandQuestion()
}

/** Field seats as answer labels for Choose-from-field brand questions. */
export function boxFieldAnswerSeats(
  rows: readonly BoxFieldRow[]
): FieldAnswerSeat[] {
  return rows.filter(isResolvedBoxSeat).map((r) => {
    const name =
      r.kind === 'prototype'
        ? (
            r.prototypeSnapshot?.name ??
            r.frozen_display_name ??
            'Prototype'
          ).trim()
        : (r.frozen_display_name ?? 'Product').trim()
    const brand = (r.frozen_brand_name ?? '').trim()
    const label = brand && r.kind === 'product' ? `${name} · ${brand}` : name
    return {
      label: label || 'Product',
      imageSrc: r.frozen_image_url ?? null,
      imageRef: null,
    }
  })
}

export function sanitizeIhutAttributes(raw: unknown): IhutAttributeCode[] {
  const allowed = new Set<string>(IHUT_GENERIC_ATTRIBUTES.map((a) => a.value))
  if (!Array.isArray(raw)) return [...IHUT_DEFAULT_ATTRIBUTES]
  const out: IhutAttributeCode[] = []
  for (const item of raw) {
    if (typeof item !== 'string' || !allowed.has(item)) continue
    if (out.includes(item as IhutAttributeCode)) continue
    out.push(item as IhutAttributeCode)
    if (out.length >= 3) break
  }
  return out.length > 0 ? out : [...IHUT_DEFAULT_ATTRIBUTES]
}

export function sanitizeIhutSuccessBars(raw: unknown): IhutSuccessBarsDraft {
  const d = IHUT_DEFAULT_SUCCESS_BARS
  if (!raw || typeof raw !== 'object') return { ...d }
  const o = raw as Record<string, unknown>
  const clamp = (v: unknown, fallback: number) => {
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n)) return fallback
    return Math.min(0.95, Math.max(0.1, n))
  }
  return {
    tasteWinShare: clamp(o.tasteWinShare ?? o.taste_win_share, d.tasteWinShare),
    likingShare: clamp(o.likingShare ?? o.liking_share, d.likingShare),
    buyAtPriceShare: clamp(o.buyAtPriceShare ?? o.buy_at_price_share, d.buyAtPriceShare),
  }
}

export function attributeLabels(codes: readonly IhutAttributeCode[]): string {
  const map = new Map(IHUT_GENERIC_ATTRIBUTES.map((a) => [a.value, a.label]))
  return codes.map((c) => map.get(c) ?? c).join(' · ')
}

/** Pairwise matchups the engines run for a given seat count. */
export function ihutBattlePairCount(seatCount: number): number {
  if (seatCount < 2) return 0
  if (seatCount <= 4) return (seatCount * (seatCount - 1)) / 2
  return 6
}

export function successBarsWire(bars: IhutSuccessBarsDraft): Record<string, number> {
  return {
    taste_win_share: bars.tasteWinShare,
    liking_share: bars.likingShare,
    buy_at_price_share: bars.buyAtPriceShare,
  }
}

export function brandQuestionsWire(
  questions: readonly IhutBrandQuestionDraft[]
): Array<{ prompt: string; options: string[]; max_select: number }> {
  return questions
    .map((q) => {
      const options = q.options.map((o) => o.trim()).filter(Boolean)
      return {
        prompt: q.prompt.trim(),
        options,
        max_select: Math.max(
          1,
          Math.min(q.max_select || 1, options.length || 1)
        ),
      }
    })
    .filter((q) => q.prompt.length >= 8 && q.options.length >= 2)
    .slice(0, 2)
}

/** Module config fragment for preview_ihut_journey / publish. */
export function ihutModuleConfigFromDraft(draft: BoxStudyDraft): Record<string, unknown> {
  const tasteOnly = draft.fieldProducts.some(
    (r) => isResolvedBoxSeat(r) && r.packaging === 'plain_sample'
  )
  const priceCheckEnabled = draft.fieldProducts
    .filter(isResolvedBoxSeat)
    .every((r) => typeof r.price === 'number' && r.price > 0)
  return {
    attributes: sanitizeIhutAttributes(draft.ihutAttributes),
    brand_questions: brandQuestionsWire(draft.ihutBrandQuestions ?? []),
    success_bars: successBarsWire(draft.ihutSuccessBars),
    taste_only: tasteOnly,
    price_check_enabled: priceCheckEnabled,
    include_day2: draft.day2LiveWithIt === true,
    method_pack: 'IHUT_CORE_V1',
  }
}
