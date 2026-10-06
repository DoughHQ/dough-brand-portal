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

export type DecisionClaim = {
  id: string
  text: string
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
  /** Proof-chapter title that adds information beyond the Overview. */
  proofTitle: string
  /** Why-chapter implication title. */
  whyTitle: string
  preference: PreferenceBrief
  preferencePct: string
  rangeLabel: string
  nDecisiveLabel: string
  confidence: string
  field: FieldBrief
  price: PriceBriefTile
  tiles: AnswerTile[]
  whyDriver: string | null
  whyHeadwind: string | null
  intentValue: string
  intentDetail: string
  supports: DecisionClaim[]
  doesNotSupport: DecisionClaim[]
  favoredComparisons: number
  reportableComparisons: number
  story: DecisionStory
  summary: ExecutiveSummary
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function winHeadline(productName: string, call: OverviewCall): string {
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

function capitalize(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value
}

function proofTitleFromField(
  productName: string,
  field: FieldBrief,
  favoredComparisons: number,
  reportableComparisons: number,
): string {
  if (reportableComparisons === 0 || !field.beatMost || !field.beatLeast) {
    return `The named competitive field for ${productName} is not reportable yet.`
  }
  if (favoredComparisons === reportableComparisons) {
    return `It cleared even against every named competitor — strongest vs ${field.beatMost.opponentName}.`
  }
  if (favoredComparisons === 0) {
    return `It did not clear even in the named field — softest vs ${field.beatLeast.opponentName}.`
  }
  if (field.beatMost.key === field.beatLeast.key) {
    return `Against the named field, the clearest read is vs ${field.beatMost.opponentName}.`
  }
  return `It cleared even against ${field.beatMost.opponentName}; ${field.beatLeast.opponentName} is the soft spot.`
}

function whyTitleFromDrivers(
  driver: string | null,
  headwind: string | null,
  call: OverviewCall,
): string {
  if (driver && headwind) {
    return `${capitalize(driver)} is the win condition; ${headwind.toLowerCase()} is the risk.`
  }
  if (driver) {
    return `${capitalize(driver)} is the clearest reason behind the preference signal.`
  }
  if (headwind) {
    return `${capitalize(headwind)} is the clearest headwind in the choice reasons.`
  }
  if (call === 'forming') {
    return 'The reasons behind choice are still forming.'
  }
  return 'Choice reasons do not yet name a clear win condition.'
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

  const whyDriver = summary.topDriver?.driver
    ? capitalize(summary.topDriver.driver)
    : null
  const whyHeadwind = summary.topHeadwind?.driver
    ? summary.topHeadwind.driver.toLowerCase()
    : null
  const whyValue = whyDriver ?? '—'
  const whyDetail =
    whyDriver && whyHeadwind
      ? `${whyDriver.toLowerCase()} drove choice; ${whyHeadwind} was the biggest headwind.`
      : whyDriver
        ? `${whyDriver.toLowerCase()} was the leading reason for choice.`
        : whyHeadwind
          ? `${whyHeadwind} was the leading headwind.`
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
    interpretationBits.push(
      `driven primarily by ${summary.topDriver.driver.toLowerCase()}`,
    )
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

  const supports: DecisionClaim[] = []
  const doesNotSupport: DecisionClaim[] = []

  if (preference.call === 'ahead' && share != null) {
    supports.push({
      id: 'pref',
      text: `Experienced preference for ${summary.productName} over the tested field (${pct01(share)}${
        preference.lo != null && preference.hi != null
          ? `, likely ${pct01(preference.lo)}–${pct01(preference.hi)}`
          : ''
      }).`,
    })
  } else if (preference.call === 'behind' && share != null) {
    supports.push({
      id: 'pref',
      text: `A clear read that ${summary.productName} did not clear even (${pct01(share)}).`,
    })
  } else if (preference.call === 'too_close') {
    supports.push({
      id: 'pref',
      text: 'That the preference interval still crosses an even split — more sample would tighten the call.',
    })
  }

  if (favoredComparisons > 0 && field.beatMost) {
    supports.push({
      id: 'field',
      text: `Named head-to-head strength vs ${field.beatMost.opponentName} (${pct01(field.beatMost.winShare)}).`,
    })
  }
  if (whyDriver) {
    supports.push({
      id: 'why',
      text: `${whyDriver} as the leading cited reason when the product won.`,
    })
  }
  if (intentShare != null) {
    supports.push({
      id: 'intent',
      text: `Stated definite buy-again intent after Session 1 (${intentValue}).`,
    })
  }

  doesNotSupport.push({
    id: 'forecast',
    text: 'A launch recommendation, sales forecast, or share-of-shelf prediction.',
  })
  if (price.status !== 'tested') {
    doesNotSupport.push({
      id: 'price',
      text:
        price.status === 'not_measured'
          ? 'A tested shelf price or willingness-to-pay — price appears only as a cited reason share.'
          : 'A priced decision from this freeze.',
    })
  }
  if (field.beatLeast && favoredComparisons < reportableComparisons) {
    doesNotSupport.push({
      id: 'soft',
      text: `That it dominates every competitor — ${field.beatLeast.opponentName} remains the soft comparison.`,
    })
  }
  doesNotSupport.push({
    id: 'causal',
    text: 'That changing one cited reason would causally move preference.',
  })

  return {
    productName: summary.productName,
    brand: envelope.report.focal_product.brand,
    call: preference.call,
    callLabel: callLabel(preference.call),
    bottomLine: winHeadline(summary.productName, preference.call),
    explanation,
    interpretation: `${interpretationBits.join(', ')}.`,
    proofTitle: proofTitleFromField(
      summary.productName,
      field,
      favoredComparisons,
      reportableComparisons,
    ),
    whyTitle: whyTitleFromDrivers(whyDriver, whyHeadwind, preference.call),
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
    whyDriver,
    whyHeadwind,
    intentValue,
    intentDetail,
    supports,
    doesNotSupport,
    favoredComparisons,
    reportableComparisons,
    story,
    summary,
  }
}

export { pct01 }
