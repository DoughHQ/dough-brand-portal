/**
 * Normalized decision-story contract for Report V2.
 *
 * Adapters map IHUT_CORE and legacy experienced payloads into one internal
 * shape. Claims carry provenance so UI copy cannot invent a stronger claim
 * than the evidence supports.
 */

import { deriveExecutiveSummary } from './executiveSummary'
import { deriveExperiencedNarrative } from './experiencedNarrative'
import { type IhutCoreReport, type IhutCoreShareRow } from './ihutCoreTypes'
import { deriveIhutNarrative } from './ihutNarrative'
import type { ExperiencedReportEnvelope } from './types'
import { ihutPriceClaims, legacyPriceClaims, mapPriceRow } from './priceClaims'

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
