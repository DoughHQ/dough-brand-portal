import type {
  IhutBarResult,
  IhutCoreAttributeRow,
  IhutCoreBarMetric,
  IhutCoreReport,
  IhutCoreVerdict,
} from './ihutCoreTypes'
import { hasIhutVerdict } from './ihutCoreTypes'

export type FindingTone = 'positive' | 'negative' | 'uncertain' | 'neutral'

export type IhutMetricFinding = {
  key: 'taste' | 'liking' | 'price'
  label: string
  result: string
  tone: FindingTone
  claim: string
  value: number | null
  bar: number | null
  lo: number | null
  hi: number | null
  n: number | null
}

export type IhutNarrative = {
  productRef: number
  productName: string
  overall: string
  tone: FindingTone
  headline: string
  explanation: string
  implication: string
  metrics: IhutMetricFinding[]
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

function metricTone(result: string): FindingTone {
  if (result === 'cleared') return 'positive'
  if (result === 'not_cleared') return 'negative'
  if (result === 'too_close_to_call' || result === 'not_enough_responses') {
    return 'uncertain'
  }
  return 'neutral'
}

function resultClaim(label: string, metric: IhutCoreBarMetric): string {
  const value = metric.share == null ? null : pct(metric.share)
  const bar = metric.bar == null ? null : pct(metric.bar)
  switch (metric.result as IhutBarResult) {
    case 'cleared':
      return `${label} cleared${bar ? ` the ${bar} bar` : ''}${value ? ` at ${value}` : ''}.`
    case 'not_cleared':
      return `${label} did not clear${bar ? ` the ${bar} bar` : ' the bar'}${value ? ` at ${value}` : ''}.`
    case 'too_close_to_call':
      return `${label} is too close to call${value ? ` at ${value}` : ''}.`
    case 'not_enough_responses':
      return `${label} needs more completed responses before a call is responsible.`
    case 'not_tested':
      return `${label} was measured without a pre-set success bar.`
    default:
      return `${label} is reported as ${String(metric.result).replace(/_/g, ' ')}.`
  }
}

function metricFinding(
  key: IhutMetricFinding['key'],
  label: string,
  metric: IhutCoreBarMetric,
): IhutMetricFinding {
  return {
    key,
    label,
    result: metric.result,
    tone: metricTone(metric.result),
    claim: resultClaim(label, metric),
    value: metric.share ?? null,
    bar: metric.bar ?? null,
    lo: metric.lo ?? null,
    hi: metric.hi ?? null,
    n: metric.n ?? null,
  }
}

function joinLabels(items: IhutMetricFinding[]): string {
  const labels = items.map((item) => item.label.toLowerCase())
  if (labels.length <= 1) return labels[0] ?? ''
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`
}

function sentenceStart(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value
}

function overallCopy(
  verdict: IhutCoreVerdict,
  metrics: IhutMetricFinding[],
): Pick<IhutNarrative, 'headline' | 'explanation' | 'implication' | 'tone'> {
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
      headline: `${verdict.name} cleared every success bar you set.`,
      explanation:
        'Taste, liking, and willingness to buy at the tested price all cleared their pre-set thresholds.',
      implication:
        'This study supports advancing the tested product and price. It is research evidence, not a sales forecast.',
    }
  }
  if (verdict.overall === 'not_cleared') {
    const failedLabels = joinLabels(failed) || 'the success test'
    const experienceCleared =
      metrics.find((m) => m.key === 'taste')?.result === 'cleared' &&
      metrics.find((m) => m.key === 'liking')?.result === 'cleared'
    return {
      tone: 'negative',
      headline: `${verdict.name} did not clear ${failedLabels}.`,
      explanation: cleared.length
        ? `${joinLabels(cleared)} cleared; ${failedLabels} did not.`
        : failed.length
          ? `The tested offer did not clear the pre-set ${failedLabels} threshold${failed.length > 1 ? 's' : ''}.`
          : 'The frozen server verdict did not clear the pre-set success test.',
      implication:
        experienceCleared && failed.every((m) => m.key === 'price')
          ? 'The product experience cleared; the tested price did not. Investigate price or value communication before scaling.'
          : 'Do not treat the current offer as validated. Use the evidence below to decide what to change before scaling.',
    }
  }
  if (verdict.overall === 'too_close_to_call') {
    const closeLabels = joinLabels(close) || 'the decision'
    return {
      tone: 'uncertain',
      headline: `${verdict.name} is still too close to call.`,
      explanation: `${sentenceStart(
        closeLabels,
      )} could land on either side of the bar once uncertainty is considered.`,
      implication:
        'Do not make the decision from the point estimate alone. The interval—not the most flattering number—is the honest result.',
    }
  }
  if (verdict.overall === 'not_enough_responses') {
    const formingLabels = joinLabels(forming) || 'the decision'
    return {
      tone: 'uncertain',
      headline: `The verdict on ${verdict.name} is still forming.`,
      explanation: `${sentenceStart(formingLabels)} ${
        forming.length <= 1 ? 'does' : 'do'
      } not yet have enough completed responses for a responsible call.`,
      implication:
        'Keep the report preliminary until the promised field is complete.',
    }
  }
  return {
    tone: 'neutral',
    headline: `${verdict.name} was measured without a complete decision frame.`,
    explanation:
      'The report contains results, but one or more success bars were not set.',
    implication:
      'Read the evidence descriptively. Do not retroactively move a bar to manufacture a pass.',
  }
}

export function deriveIhutNarrative(
  report: IhutCoreReport,
): IhutNarrative | null {
  if (!hasIhutVerdict(report.verdict)) return null
  const verdict = report.verdict
  const metrics = [
    metricFinding('taste', 'Taste', verdict.taste_win),
    metricFinding('liking', 'Liking', verdict.liking),
    metricFinding('price', 'Buy at price', verdict.buy_at_price),
  ]
  return {
    productRef: verdict.ref,
    productName: verdict.name,
    overall: verdict.overall,
    metrics,
    ...overallCopy(verdict, metrics),
  }
}

export type AttributeDirection = {
  label: string
  direction: 'too_little' | 'too_much'
  share: number
  claim: string
}

export function strongestAttributeDirection(
  rows: IhutCoreAttributeRow[],
  heroRef: number,
): AttributeDirection | null {
  const heroRows = rows.filter((row) => row.ref === heroRef)
  let strongest: AttributeDirection | null = null
  for (const row of heroRows) {
    const little = row.too_little_share ?? 0
    const much = row.too_much_share ?? 0
    const direction = little >= much ? 'too_little' : 'too_much'
    const share = Math.max(little, much)
    if (share <= 0 || (strongest && strongest.share >= share)) continue
    const label = row.attribute_label || row.attribute
    strongest = {
      label,
      direction,
      share,
      claim:
        direction === 'too_little'
          ? `${pct(share)} found ${label.toLowerCase()} too low.`
          : `${pct(share)} found ${label.toLowerCase()} too high.`,
    }
  }
  return strongest
}
