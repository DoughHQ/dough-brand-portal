import {
  hasIhutVerdict,
  type IhutCoreReport,
  type IhutCoreShareRow,
} from './ihutCoreTypes'
import type { ExperiencedReportEnvelope } from './types'
import type {
  ClaimStatus,
  DecisionClaim,
  DecisionStory,
  PriceDistribution,
} from './decisionStory'

function asUnit(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return value > 1 ? value / 100 : value
}

function pct(value: number | null | undefined): string {
  const unit = asUnit(value)
  return unit == null ? '—' : `${Math.round(unit * 100)}%`
}

function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'the tested shelf price'
  return `$${value.toFixed(2)}`
}

function statusFromN(
  n: number | null | undefined,
  descriptiveFloor = 10,
  decisionFloor = 30,
): ClaimStatus {
  if (n == null || n <= 0) return 'withheld'
  if (n < descriptiveFloor) return 'withheld'
  if (n < decisionFloor) return 'small_base'
  return 'reportable'
}

export function mapPriceRow(
  row: IhutCoreShareRow & {
    tested_price_dollars?: number | null
    maybe_share?: number | null
    no_share?: number | null
    yes_n?: number | null
    maybe_n?: number | null
    no_n?: number | null
    reportable?: boolean
    decision_ready?: boolean
    session_number?: number
  },
  sessionNumber: 1 | 2,
): PriceDistribution {
  const n = row.n ?? 0
  return {
    ref: row.ref,
    name: row.name,
    n,
    testedPriceDollars: row.tested_price_dollars ?? null,
    yesShare: row.yes_share ?? null,
    maybeShare: row.maybe_share ?? null,
    noShare: row.no_share ?? null,
    yesN: row.yes_n ?? null,
    maybeN: row.maybe_n ?? null,
    noN: row.no_n ?? null,
    lo: row.lo ?? null,
    hi: row.hi ?? null,
    reportable: row.reportable ?? n >= 10,
    decisionReady: row.decision_ready ?? n >= 30,
    sessionNumber,
  }
}

export function legacyPriceClaims(envelope: ExperiencedReportEnvelope): DecisionClaim[] {
  const lost = envelope.report.choice_drivers?.by_outcome.focal_lost ?? []
  const priceDriver = lost.find(
    (row) =>
      row.reportable &&
      row.share != null &&
      row.driver.trim().toLowerCase() === 'price',
  )
  const claims: DecisionClaim[] = [
    {
      id: 'legacy-price-not-measured',
      kind: 'limitation',
      status: 'not_measured',
      title: 'No tested shelf-price intent was measured',
      body: 'This legacy study did not ask respondents whether they would buy at a specific shelf price. Price appears only as a stated reason for choice.',
      source: 'legacy experienced payload',
      limitation:
        'Do not infer demand, elasticity, willingness to pay, or an optimal price from reason-share alone.',
    },
  ]
  if (priceDriver?.share != null) {
    claims.push({
      id: 'legacy-price-headwind',
      kind: 'evidence',
      status: 'reportable',
      title: `Price was cited against the product ${pct(priceDriver.share)} of the time`,
      body: 'Among choices the product lost, respondents most often named price. That is a reason share, not a measured reaction to a tested dollar amount.',
      source: 'choice_drivers.focal_lost',
      value: priceDriver.share,
      n: priceDriver.n_citing ?? null,
    })
  }
  return claims
}

export function ihutPriceClaims(
  report: IhutCoreReport,
  price: DecisionStory['price'],
): DecisionClaim[] {
  const claims: DecisionClaim[] = []
  if (!price.enabled) {
    claims.push({
      id: 'price-disabled',
      kind: 'limitation',
      status: 'not_applicable',
      title: 'Price checks were off for this study',
      body: 'At least one seat lacked a positive shelf price, or the box ran taste-only. No tested-offer intent is reported.',
      source: 'price_check_enabled',
    })
    return claims
  }

  const hero =
    price.day1.find((row) =>
      price.testedPrices.some((p) => p.ref === row.ref && p.isYours),
    ) ?? price.day1[0]

  if (!hero) {
    claims.push({
      id: 'price-forming',
      kind: 'limitation',
      status: 'withheld',
      title: 'Tested-offer intent is still forming',
      body: 'Price responses have not cleared the reporting floor.',
      source: 'price_intent.day1',
    })
    return claims
  }

  const status = statusFromN(hero.n)
  claims.push({
    id: 'price-day1-yes',
    kind: 'evidence',
    status,
    title: `${pct(hero.yesShare)} said Yes at ${money(hero.testedPriceDollars)}`,
    body: `Day 1 tested-offer intent for ${hero.name}. Full Yes/Maybe/No distribution is shown below. This is stated intent at one frozen shelf price — not demand or conversion.`,
    source: 'price_intent.day1',
    n: hero.n,
    value: hero.yesShare,
    lo: hero.lo,
    hi: hero.hi,
    limitation:
      status === 'small_base'
        ? 'Base is below the decision floor (30). Treat as descriptive evidence only.'
        : null,
  })

  const day2 = price.day2.find((row) => row.ref === hero.ref)
  if (day2 && day2.n > 0) {
    claims.push({
      id: 'price-day2-yes',
      kind: 'evidence',
      status: statusFromN(day2.n),
      title: `${pct(day2.yesShare)} said Yes on Day 2 at ${money(day2.testedPriceDollars)}`,
      body: 'Same tested shelf price after living with the product. Day movement is paired only when both answers exist.',
      source: 'price_intent.day2',
      n: day2.n,
      value: day2.yesShare,
      lo: day2.lo,
      hi: day2.hi,
    })
  }

  const transition = price.transitions.find((row) => row.ref === hero.ref)
  if (transition?.reportable) {
    claims.push({
      id: 'price-paired-change',
      kind: 'evidence',
      status: statusFromN(transition.nPaired),
      title: `${pct(transition.improvedShare)} improved · ${pct(transition.stableShare)} held · ${pct(transition.worsenedShare)} worsened`,
      body: `Among ${transition.nPaired} respondents who answered the price question on both days for ${transition.name}.`,
      source: 'price_intent.day1_to_day2',
      n: transition.nPaired,
    })
  }

  const leak = price.valueLeakage.find((row) => row.ref === hero.ref)
  if (leak?.reportable && leak.share != null) {
    claims.push({
      id: 'price-value-leakage',
      kind: 'interpretation',
      status: statusFromN(leak.nFirst),
      title: `${pct(leak.share)} of first-ranked picks said No at the tested price`,
      body: 'Observational gap between stated buy-order preference and tested-offer intent. Not a causal price effect.',
      source: 'price_intent.value_leakage',
      n: leak.nFirst,
      value: leak.share,
    })
  }

  const verdict = hasIhutVerdict(report.verdict) ? report.verdict.buy_at_price : null
  if (verdict && verdict.result && verdict.result !== 'not_tested') {
    claims.push({
      id: 'price-bar',
      kind: 'interpretation',
      status:
        verdict.result === 'not_enough_responses'
          ? 'small_base'
          : 'reportable',
      title: `Buy-at-price bar ${String(verdict.result).replace(/_/g, ' ')}`,
      body: `Pre-set bar ${pct(verdict.bar)} judged against the Day 1 Yes interval. Decision floor is 30 answers.`,
      source: 'verdict.buy_at_price',
      n: verdict.n ?? null,
      value: verdict.share ?? null,
      lo: verdict.lo ?? null,
      hi: verdict.hi ?? null,
    })
  }

  return claims
}
