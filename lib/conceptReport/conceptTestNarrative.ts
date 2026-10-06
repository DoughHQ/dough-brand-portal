import type {
  ConceptTestReport,
  ConceptTestVerdict,
  ConceptTestVerdictResult,
} from './conceptTestTypes'

export type ConceptFindingTone =
  | 'positive'
  | 'negative'
  | 'uncertain'
  | 'neutral'

export type ConceptMetricFinding = {
  key: 'head_to_head' | 'liking' | 'price'
  label: string
  result: ConceptTestVerdictResult
  tone: ConceptFindingTone
  value: string
  interval: string
  bar: string
  claim: string
}

export type ConceptVerdictNarrative = {
  ref: number
  name: string
  overall: ConceptTestVerdictResult
  tone: ConceptFindingTone
  headline: string
  explanation: string
  implication: string
  metrics: ConceptMetricFinding[]
}

function pct(value: number): string {
  return `${Math.round(value * 1000) / 10}%`
}

function toneFor(result: ConceptTestVerdictResult): ConceptFindingTone {
  if (result === 'cleared') return 'positive'
  if (result === 'not_cleared') return 'negative'
  if (result === 'too_close_to_call' || result === 'not_enough_responses') {
    return 'uncertain'
  }
  return 'neutral'
}

function resultPhrase(
  label: string,
  result: ConceptTestVerdictResult,
  bar: number,
): string {
  switch (result) {
    case 'cleared':
      return `${label} cleared the ${pct(bar)} bar.`
    case 'not_cleared':
      return `${label} did not clear the ${pct(bar)} bar.`
    case 'too_close_to_call':
      return `${label} is too close to call; its confidence interval crosses the ${pct(bar)} bar.`
    case 'not_enough_responses':
      return `${label} needs more responses before a call is responsible.`
    default:
      return `${label} is reported as ${String(result).replace(/_/g, ' ')}.`
  }
}

function metricsFor(verdict: ConceptTestVerdict): ConceptMetricFinding[] {
  const likingValue =
    verdict.liking.difference_top_two == null
      ? 'Paired liking'
      : `${verdict.liking.difference_top_two >= 0 ? '+' : ''}${pct(
          verdict.liking.difference_top_two,
        )}`
  const priceShare =
    Math.abs(verdict.price.share_conservative - verdict.price.share_generous) <
    1e-9
      ? pct(verdict.price.share_conservative)
      : `${pct(verdict.price.share_conservative)}–${pct(verdict.price.share_generous)}`
  return [
    {
      key: 'head_to_head',
      label: 'Head-to-head choice',
      result: verdict.head_to_head.result,
      tone: toneFor(verdict.head_to_head.result),
      value: pct(verdict.head_to_head.win_share),
      interval: `${pct(verdict.head_to_head.lo)}–${pct(verdict.head_to_head.hi)}`,
      bar: pct(verdict.head_to_head.bar),
      claim: resultPhrase(
        'Head-to-head choice',
        verdict.head_to_head.result,
        verdict.head_to_head.bar,
      ),
    },
    {
      key: 'liking',
      label: 'Liking advantage',
      result: verdict.liking.result,
      tone: toneFor(verdict.liking.result),
      value: likingValue,
      interval: `${pct(verdict.liking.lo)}–${pct(verdict.liking.hi)}`,
      bar: pct(verdict.liking.bar),
      claim: resultPhrase(
        'Liking advantage',
        verdict.liking.result,
        verdict.liking.bar,
      ),
    },
    {
      key: 'price',
      label: `Would pay $${verdict.price.anchor.toFixed(2)}`,
      result: verdict.price.result,
      tone: toneFor(verdict.price.result),
      value: priceShare,
      interval: `${pct(verdict.price.lo)}–${pct(verdict.price.hi)}`,
      bar: pct(verdict.price.bar),
      claim: resultPhrase(
        `Willingness to pay $${verdict.price.anchor.toFixed(2)}`,
        verdict.price.result,
        verdict.price.bar,
      ),
    },
  ]
}

function overallCopy(
  verdict: ConceptTestVerdict,
  metrics: ConceptMetricFinding[],
): Pick<
  ConceptVerdictNarrative,
  'headline' | 'explanation' | 'implication' | 'tone'
> {
  const failed = metrics.filter((metric) => metric.result === 'not_cleared')
  const close = metrics.filter(
    (metric) => metric.result === 'too_close_to_call',
  )
  const forming = metrics.filter(
    (metric) => metric.result === 'not_enough_responses',
  )
  const cleared = metrics.filter((metric) => metric.result === 'cleared')

  if (verdict.overall === 'cleared') {
    return {
      tone: 'positive',
      headline: `${verdict.name} cleared the success test.`,
      explanation:
        'The concept cleared every pre-set decision threshold in this test.',
      implication:
        'The evidence supports advancing this concept to the next stage. It does not forecast sales.',
    }
  }
  if (verdict.overall === 'not_cleared') {
    const labels = failed
      .map((metric) => metric.label.toLowerCase())
      .join(' and ')
    return {
      tone: 'negative',
      headline: `${verdict.name} did not clear the success test.`,
      explanation: labels
        ? `${labels} did not clear ${failed.length === 1 ? 'its' : 'their'} pre-set bar${failed.length === 1 ? '' : 's'}.`
        : 'The server verdict did not clear the concept against the pre-set decision frame.',
      implication: cleared.length
        ? `There is positive evidence on ${cleared
            .map((metric) => metric.label.toLowerCase())
            .join(' and ')}, but the concept is not validated as a whole.`
        : 'Use the evidence below to decide what to change before advancing.',
    }
  }
  if (verdict.overall === 'too_close_to_call') {
    return {
      tone: 'uncertain',
      headline: `The decision on ${verdict.name} is still too close to call.`,
      explanation: close.length
        ? 'At least one confidence interval crosses its pre-set success bar, so the attractive point estimate is not a pass.'
        : 'The frozen server verdict is too close to call; this report does not upgrade it from the point estimates.',
      implication:
        'Do not choose from the point estimate alone. More evidence—or a deliberate tolerance for uncertainty—is required.',
    }
  }
  if (verdict.overall === 'not_enough_responses') {
    return {
      tone: 'uncertain',
      headline: `The verdict on ${verdict.name} is still forming.`,
      explanation:
        'The report does not yet have enough responses for a responsible decision.',
      implication:
        'Keep this read preliminary until the promised field is complete.',
    }
  }
  return {
    tone: 'neutral',
    headline: `${verdict.name} has no final decision yet.`,
    explanation: `The server verdict is ${String(verdict.overall).replace(/_/g, ' ')}.`,
    implication:
      'Read the evidence below descriptively and preserve the pre-set decision rules.',
  }
}

export function deriveConceptNarratives(
  report: ConceptTestReport,
): ConceptVerdictNarrative[] {
  return report.verdict.map((verdict) => {
    const metrics = metricsFor(verdict)
    return {
      ref: verdict.ref,
      name: verdict.name,
      overall: verdict.overall,
      metrics,
      ...overallCopy(verdict, metrics),
    }
  })
}
