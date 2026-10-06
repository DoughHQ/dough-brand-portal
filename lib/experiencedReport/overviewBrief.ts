/**
 * Overview Bottom Line — the four answers a brand manager needs in ~5 seconds.
 * Pure derivation from existing report payload. No invented ranks or prices.
 */

import {
  asUnit,
  deriveExecutiveSummary,
  type ExecutiveSummary,
} from './executiveSummary'
import { deriveDecisionStory, type DecisionStory } from './decisionStory'
import {
  deriveFieldBrief,
  derivePreferenceBrief,
  derivePriceBriefTile,
  pct01,
  type FieldBrief,
  type PreferenceBrief,
  type PriceBriefTile,
} from './fieldBrief'
import type { ExperiencedReportEnvelope } from './types'

export type OverviewCall = PreferenceBrief['call']

export type AnswerTile = {
  id: 'field' | 'why' | 'intent' | 'price'
  label: string
  value: string
  detail: string
  href: string
  muted?: boolean
}

export type OverviewBrief = {
  productName: string
  brand: string | null
  call: OverviewCall
  callLabel: string
  /** Decisive headline for the memo — win / too close / behind / forming. */
  bottomLine: string
  explanation: string
  interpretation: string
  preference: PreferenceBrief
  preferencePct: string
  rangeLabel: string
  nDecisiveLabel: string
  confidence: string
  field: FieldBrief
  price: PriceBriefTile
  tiles: AnswerTile[]
  favoredComparisons: number
  reportableComparisons: number
  story: DecisionStory
  summary: ExecutiveSummary
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function winHeadline(
  productName: string,
  call: OverviewCall,
): string {
  switch (call) {
    case 'ahead':
      return `${productName} won the choice test.`
    case 'behind':
      return `${productName} did not win the choice test.`
    case 'too_close':
      return `${productName} is too close to call.`
    default:
      return `The choice read on ${productName} is still forming.`
  }
}

function callLabel(call: OverviewCall): string {
  switch (call) {
    case 'ahead':
      return 'Won'
    case 'behind':
      return 'Did not win'
    case 'too_close':
      return 'Too close to call'
    default:
      return 'Still forming'
  }
}

export function deriveOverviewBrief(
  envelope: ExperiencedReportEnvelope,
): OverviewBrief {
  const summary = deriveExecutiveSummary(envelope)
  const story = deriveDecisionStory(envelope)
  const preference = derivePreferenceBrief({
    share: summary.headline?.value ?? null,
    lo: summary.headline?.ci_low ?? null,
    hi: summary.headline?.ci_high ?? null,
    nDecisive: summary.nDecisive,
    direction: summary.direction,
  })
  const field = deriveFieldBrief(envelope.report.per_opponent)
  const price = derivePriceBriefTile(story)

  const favoredComparisons = field.rows.filter((r) => r.call === 'win').length
  const reportableComparisons = field.fieldSize

  const fieldValue =
    field.beatMost && field.beatLeast && reportableComparisons > 0
      ? reportableComparisons === 1
        ? pct01(field.beatMost.winShare)
        : `${pct01(Math.min(...field.rows.map((r) => r.winShare)))}–${pct01(
            Math.max(...field.rows.map((r) => r.winShare)),
          )}`
      : '—'

  const fieldDetail =
    reportableComparisons === 0
      ? 'No named comparisons are reportable yet.'
      : favoredComparisons === reportableComparisons && reportableComparisons > 0
        ? `Preferred in all ${reportableComparisons} named comparison${
            reportableComparisons === 1 ? '' : 's'
          }.`
        : favoredComparisons > 0
          ? `Preferred in ${favoredComparisons} of ${reportableComparisons} named comparisons.`
          : `Strongest vs ${field.beatMost?.opponentName ?? 'field'}; weakest vs ${
              field.beatLeast?.opponentName ?? 'field'
            }.`

  const whyValue = summary.topDriver?.driver
    ? summary.topDriver.driver.replace(/^./, (c) => c.toUpperCase())
    : '—'
  const whyDetail =
    summary.topDriver && summary.topHeadwind
      ? `${summary.topDriver.driver} drove choice; ${summary.topHeadwind.driver} was the biggest headwind.`
      : summary.topDriver
        ? `${summary.topDriver.driver} was the leading reason for choice.`
        : summary.topHeadwind
          ? `${summary.topHeadwind.driver} was the leading headwind.`
          : 'Choice reasons are still forming.'

  const intentShare =
    summary.definiteYes?.rate != null
      ? clamp01(asUnit(summary.definiteYes.rate))
      : null
  const intentValue = intentShare == null ? '—' : pct01(intentShare)
  const intentDetail =
    intentShare == null
      ? 'Buy-again intent is not reportable yet.'
      : 'Definitely would buy again after Session 1. Stated intent — not observed repeat sales.'

  const tiles: AnswerTile[] = [
    {
      id: 'field',
      label: 'Against the field',
      value: fieldValue,
      detail: fieldDetail,
      href: '#performance',
    },
    {
      id: 'why',
      label: 'Why it wins',
      value: whyValue,
      detail: whyDetail,
      href: '#why',
    },
    {
      id: 'intent',
      label: 'Would they buy again?',
      value: intentValue,
      detail: intentDetail,
      href: '#intent',
      muted: intentShare == null,
    },
    {
      id: 'price',
      label: 'Price',
      value: price.priceLabel ?? price.title,
      detail: price.detail,
      href: '#price',
      muted: price.status !== 'tested',
    },
  ]

  const interpretationBits: string[] = []
  if (preference.call === 'ahead') {
    interpretationBits.push('A meaningful preference signal')
  } else if (preference.call === 'behind') {
    interpretationBits.push('Preference did not clear an even split')
  } else if (preference.call === 'too_close') {
    interpretationBits.push('The preference interval still crosses even')
  } else {
    interpretationBits.push('The preference read is still forming')
  }
  if (summary.topDriver) {
    interpretationBits.push(`driven primarily by ${summary.topDriver.driver.toLowerCase()}`)
  }
  if (summary.topHeadwind) {
    interpretationBits.push(
      `with ${summary.topHeadwind.driver.toLowerCase()} the clearest headwind`,
    )
  }

  const share = preference.share
  const explanation =
    share == null
      ? 'The study does not yet have a reportable experienced-preference result.'
      : `It was chosen ${pct01(share)} of the time${
          preference.nDecisive != null
            ? ` across ${preference.nDecisive} decisive choices`
            : ''
        }.${
          preference.lo != null && preference.hi != null
            ? ` The likely range is ${pct01(preference.lo)}–${pct01(preference.hi)}.`
            : ''
        }`

  return {
    productName: summary.productName,
    brand: envelope.report.focal_product.brand,
    call: preference.call,
    callLabel: callLabel(preference.call),
    bottomLine: winHeadline(summary.productName, preference.call),
    explanation,
    interpretation: `${interpretationBits.join(', ')}.`,
    preference,
    preferencePct: pct01(share),
    rangeLabel:
      preference.lo != null && preference.hi != null
        ? `${pct01(preference.lo)}–${pct01(preference.hi)}`
        : 'Interval pending',
    nDecisiveLabel:
      preference.nDecisive != null
        ? `${preference.nDecisive} decisive choices`
        : 'Decisive base pending',
    confidence: summary.confidence,
    field,
    price,
    tiles,
    favoredComparisons,
    reportableComparisons,
    story,
    summary,
  }
}

export { pct01 }
