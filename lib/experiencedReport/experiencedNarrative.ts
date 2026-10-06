import { deriveExecutiveSummary } from './executiveSummary'
import type { ExperiencedReportEnvelope } from './types'

export type ExperiencedNarrativeTone =
  | 'positive'
  | 'negative'
  | 'uncertain'
  | 'neutral'

export type ExperiencedNarrative = {
  productName: string
  tone: ExperiencedNarrativeTone
  headline: string
  explanation: string
  implication: string
  preferenceShare: number | null
  intervalLow: number | null
  intervalHigh: number | null
  nDecisive: number | null
  direction: 'more' | 'less' | 'close' | null
}

function pct(value: number): string {
  const unit = value > 1 ? value / 100 : value
  return `${Math.round(unit * 100)}%`
}

export function deriveExperiencedNarrative(
  envelope: ExperiencedReportEnvelope,
): ExperiencedNarrative {
  const summary = deriveExecutiveSummary(envelope)
  const preferenceShare = summary.headline?.value ?? null
  const intervalLow = summary.headline?.ci_low ?? null
  const intervalHigh = summary.headline?.ci_high ?? null

  if (!summary.preferenceReportable || preferenceShare == null) {
    return {
      productName: summary.productName,
      tone: 'neutral',
      headline: `The preference read on ${summary.productName} is still forming.`,
      explanation:
        'The study does not yet have a reportable experienced-preference result.',
      implication:
        'Keep this report preliminary. Missing evidence is not replaced with a directional claim.',
      preferenceShare,
      intervalLow,
      intervalHigh,
      nDecisive: summary.nDecisive,
      direction: null,
    }
  }

  const interval =
    intervalLow != null && intervalHigh != null
      ? ` The likely range is ${pct(intervalLow)}–${pct(intervalHigh)}.`
      : ''
  const basis = summary.nDecisive
    ? ` across ${summary.nDecisive} decisive choices`
    : ''

  if (summary.direction === 'more') {
    return {
      productName: summary.productName,
      tone: 'positive',
      headline: `${summary.productName} was chosen more often than not after use.`,
      explanation: `It was chosen ${pct(preferenceShare)} of the time${basis}.${interval}`,
      implication:
        'Experienced preference is a positive signal in this tested field. It is not a launch recommendation or sales forecast.',
      preferenceShare,
      intervalLow,
      intervalHigh,
      nDecisive: summary.nDecisive,
      direction: summary.direction,
    }
  }

  if (summary.direction === 'less') {
    return {
      productName: summary.productName,
      tone: 'negative',
      headline: `${summary.productName} did not lead preference after use.`,
      explanation: `It was chosen ${pct(preferenceShare)} of the time${basis}.${interval}`,
      implication:
        'Do not treat experienced preference as validated. Use the comparison and diagnostic evidence below to decide what to change.',
      preferenceShare,
      intervalLow,
      intervalHigh,
      nDecisive: summary.nDecisive,
      direction: summary.direction,
    }
  }

  return {
    productName: summary.productName,
    tone: 'uncertain',
    headline: `Preference for ${summary.productName} is still too close to call.`,
    explanation: `It was chosen ${pct(preferenceShare)} of the time${basis}, but the likely range still crosses an even split.${interval}`,
    implication:
      'Do not decide from the point estimate alone. The experienced-preference evidence can still land on either side of 50%.',
    preferenceShare,
    intervalLow,
    intervalHigh,
    nDecisive: summary.nDecisive,
    direction: summary.direction,
  }
}
