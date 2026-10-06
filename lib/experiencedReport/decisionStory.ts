/**
 * Normalized decision-story contract for Report V2.
 *
 * Adapters map IHUT_CORE and legacy experienced payloads into one internal
 * shape. Claims carry provenance so UI copy cannot invent a stronger claim
 * than the evidence supports.
 */

import { deriveExecutiveSummary } from './executiveSummary'
import { deriveExperiencedNarrative } from './experiencedNarrative'
import {
  hasIhutVerdict,
  type IhutCoreReport,
  type IhutCoreShareRow,
} from './ihutCoreTypes'
import { deriveIhutNarrative } from './ihutNarrative'
import type { ExperiencedReportEnvelope } from './types'

export type ClaimKind = 'evidence' | 'interpretation' | 'next_test' | 'limitation'

export type ClaimStatus =
  | 'reportable'
  | 'small_base'
  | 'withheld'
  | 'not_measured'
  | 'not_applicable'

export type DecisionClaim = {
  id: string
  kind: ClaimKind
  status: ClaimStatus
  title: string
  body: string
  source: string
  n?: number | null
  value?: number | null
  lo?: number | null
  hi?: number | null
  limitation?: string | null
}

export type PriceDistribution = {
  ref: number
  name: string
  n: number
  testedPriceDollars: number | null
  yesShare: number | null
  maybeShare: number | null
  noShare: number | null
  yesN?: number | null
  maybeN?: number | null
  noN?: number | null
  lo: number | null
  hi: number | null
  reportable: boolean
  decisionReady: boolean
  sessionNumber: 1 | 2
}

export type PriceTransition = {
  ref: number
  name: string
  nPaired: number
  improvedShare: number | null
  worsenedShare: number | null
  stableShare: number | null
  matrix: Record<string, number | null>
  reportable: boolean
}

export type ValueLeakage = {
  ref: number
  name: string
  nFirst: number
  nFirstButNoAtPrice: number
  share: number | null
  reportable: boolean
}

export type DecisionChapterId =
  | 'decision'
  | 'field'
  | 'diagnosis'
  | 'price'
  | 'durability'
  | 'trust'

export type DecisionStory = {
  analysisVersion: 'REPORT_V2'
  family: 'ihut_core' | 'legacy_experienced'
  productName: string
  productBrand: string | null
  headline: string
  explanation: string
  implication: string
  tone: 'positive' | 'negative' | 'uncertain' | 'neutral'
  stageLabel: string
  participation: {
    nUsers: number
    nSessions: number
    targetCompletions: number | null
    completionsDelivered: number | null
  }
  price: {
    measured: boolean
    enabled: boolean | null
    label: 'tested_offer_intent' | 'not_measured'
    interpretation: string
    testedPrices: Array<{
      ref: number
      name: string
      isYours?: boolean
      priceDollars: number | null
    }>
    day1: PriceDistribution[]
    day2: PriceDistribution[]
    transitions: PriceTransition[]
    valueLeakage: ValueLeakage[]
    claims: DecisionClaim[]
  }
  claims: DecisionClaim[]
  chapters: DecisionChapterId[]
}

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

function mapPriceRow(
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

function legacyPriceClaims(envelope: ExperiencedReportEnvelope): DecisionClaim[] {
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

function ihutPriceClaims(
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

export function deriveDecisionStory(
  envelope: ExperiencedReportEnvelope,
): DecisionStory {
  const core = envelope.report.ihut_core
  const stage = envelope.report.report_stage
  const participation = {
    nUsers: envelope.report.participation.n_users,
    nSessions: envelope.report.participation.n_sessions,
    targetCompletions: stage.target_completions ?? null,
    completionsDelivered: stage.completions_delivered ?? null,
  }
  const stageLabel = stage.is_final ? 'Final read' : 'Preliminary read'

  if (core && typeof core === 'object') {
    const narrative = deriveIhutNarrative(core)
    const intent = (core as IhutCoreReport & {
      price_intent?: {
        price_check_enabled?: boolean
        tested_prices?: Array<{
          ref: number
          name: string
          is_yours?: boolean
          price_dollars?: number | null
        }>
        day1?: Array<IhutCoreShareRow & Record<string, unknown>>
        day2?: Array<IhutCoreShareRow & Record<string, unknown>>
        day1_to_day2?: Array<Record<string, unknown>>
        value_leakage?: Array<Record<string, unknown>>
        interpretation?: string
      }
      price_check_enabled?: boolean
      analysis_version?: string
    }).price_intent

    const enabled =
      intent?.price_check_enabled ??
      (core as { price_check_enabled?: boolean }).price_check_enabled ??
      ((core.price_check?.length ?? 0) > 0)

    const day1Source = (intent?.day1 as typeof core.price_check | undefined) ??
      core.price_check ??
      []
    const day2Source =
      (intent?.day2 as typeof core.price_check | undefined) ??
      ((core.day2 as { price_check?: typeof core.price_check })?.price_check ??
        [])

    const price: DecisionStory['price'] = {
      measured: Boolean(enabled),
      enabled: Boolean(enabled),
      label: enabled ? 'tested_offer_intent' : 'not_measured',
      interpretation:
        intent?.interpretation ??
        'Stated willingness to buy at each product’s frozen shelf price after tasting. Not demand, elasticity, conversion, or an optimal price.',
      testedPrices: (intent?.tested_prices ?? []).map((row) => ({
        ref: row.ref,
        name: row.name,
        isYours: row.is_yours,
        priceDollars: row.price_dollars ?? null,
      })),
      day1: day1Source.map((row) => mapPriceRow(row as never, 1)),
      day2: day2Source.map((row) => mapPriceRow(row as never, 2)),
      transitions: (intent?.day1_to_day2 ?? []).map((row) => ({
        ref: Number(row.ref),
        name: String(row.name ?? ''),
        nPaired: Number(row.n_paired ?? 0),
        improvedShare:
          typeof row.improved_share === 'number' ? row.improved_share : null,
        worsenedShare:
          typeof row.worsened_share === 'number' ? row.worsened_share : null,
        stableShare:
          typeof row.stable_share === 'number' ? row.stable_share : null,
        matrix: (row.matrix as Record<string, number | null>) ?? {},
        reportable: Boolean(row.reportable),
      })),
      valueLeakage: (intent?.value_leakage ?? []).map((row) => ({
        ref: Number(row.ref),
        name: String(row.name ?? ''),
        nFirst: Number(row.n_first ?? 0),
        nFirstButNoAtPrice: Number(row.n_first_but_no_at_price ?? 0),
        share: typeof row.share === 'number' ? row.share : null,
        reportable: Boolean(row.reportable),
      })),
      claims: [],
    }
    price.claims = ihutPriceClaims(core, price)

    return {
      analysisVersion: 'REPORT_V2',
      family: 'ihut_core',
      productName:
        narrative?.productName || envelope.report.focal_product.name || 'Product',
      productBrand: envelope.report.focal_product.brand,
      headline:
        narrative?.headline ??
        `The verdict on ${envelope.report.focal_product.name} is still forming.`,
      explanation:
        narrative?.explanation ??
        'The study exists, but the decision payload is not ready.',
      implication:
        narrative?.implication ??
        'Keep this read preliminary until the success-bar verdict is available.',
      tone: narrative?.tone ?? 'neutral',
      stageLabel,
      participation,
      price,
      claims: price.claims,
      chapters: ['decision', 'field', 'diagnosis', 'price', 'durability', 'trust'],
    }
  }

  const narrative = deriveExperiencedNarrative(envelope)
  const summary = deriveExecutiveSummary(envelope)
  const priceClaims = legacyPriceClaims(envelope)

  return {
    analysisVersion: 'REPORT_V2',
    family: 'legacy_experienced',
    productName: narrative.productName,
    productBrand: envelope.report.focal_product.brand,
    headline: narrative.headline,
    explanation: narrative.explanation,
    implication: narrative.implication,
    tone: narrative.tone,
    stageLabel,
    participation,
    price: {
      measured: false,
      enabled: false,
      label: 'not_measured',
      interpretation:
        'Legacy experienced studies did not collect tested-offer intent at a shelf price.',
      testedPrices: [],
      day1: [],
      day2: [],
      transitions: [],
      valueLeakage: [],
      claims: priceClaims,
    },
    claims: [
      {
        id: 'legacy-preference',
        kind: 'evidence',
        status: summary.preferenceReportable ? 'reportable' : 'withheld',
        title: narrative.headline,
        body: narrative.explanation,
        source: 'headline_win_rate',
        n: summary.nDecisive,
        value: summary.headline?.value ?? null,
        lo: summary.headline?.ci_low ?? null,
        hi: summary.headline?.ci_high ?? null,
      },
      ...priceClaims,
    ],
    chapters: ['decision', 'field', 'diagnosis', 'price', 'durability', 'trust'],
  }
}
