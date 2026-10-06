import { describe, expect, it } from 'vitest'
import { deriveDecisionStory } from '../decisionStory'
import type { ExperiencedReportEnvelope } from '../types'
import type { IhutCoreReport } from '../ihutCoreTypes'

function legacyEnvelope(): ExperiencedReportEnvelope {
  return {
    status: 'ok',
    is_simulated: true,
    report_id: 'legacy-1',
    mission_id: 'd46f378b-a145-47b8-9f25-7989849b909a',
    brand_id: 1,
    focal_product_id: 1,
    snapshot_date: '2026-08-27',
    computed_at: '2026-08-27T12:00:00Z',
    is_current: true,
    report: {
      focal_product: {
        product_id: 1,
        name: 'Organic Garlic Powder',
        brand: 'Simply Organic',
      },
      participation: { n_users: 100, n_claims: 100, n_sessions: 100 },
      report_stage: {
        stage: 'final',
        is_final: true,
        target_completions: 100,
        completions_delivered: 100,
      },
      reliability: null,
      evidence_composition: null,
      methodology: null,
      headline_win_rate: [
        {
          value: 0.62,
          ci_low: 0.57,
          ci_high: 0.67,
          reportable: true,
          withheld_reason: null,
          n_decisive: 400,
          experience_split: 'experienced_vs_experienced',
        },
      ],
      per_opponent: [],
      choice_drivers: {
        by_outcome: {
          focal_won: [
            {
              driver: 'taste',
              share: 0.39,
              reportable: true,
              value: 0.39,
              ci_low: null,
              ci_high: null,
              withheld_reason: null,
            },
          ],
          focal_lost: [
            {
              driver: 'price',
              share: 0.4,
              reportable: true,
              value: 0.4,
              ci_low: null,
              ci_high: null,
              withheld_reason: null,
            },
          ],
        },
      },
      rank_validation: null,
      attribute_importance: null,
      repurchase_intent: null,
      experience_lift_vs_baseline: null,
      ihut_core: null,
    },
  }
}

function ihutEnvelope(priceIntent = true): ExperiencedReportEnvelope {
  const report: IhutCoreReport & {
    analysis_version: string
    price_check_enabled: boolean
    price_intent: Record<string, unknown>
  } = {
    version: 'IHUT_CORE_V1',
    analysis_version: 'REPORT_V2',
    taste_only: false,
    price_check_enabled: true,
    success_bars: {
      taste_win_share: 0.55,
      liking_share: 0.6,
      buy_at_price_share: 0.55,
    },
    promise_vs_delivery: {
      shelf: [],
      taste: [],
      map: [],
      note: 'Pack strength vs taste strength.',
    },
    liking: [],
    price_check: [
      {
        ref: 1,
        name: 'Keel Lemon Water',
        n: 64,
        yes_share: 0.47,
        maybe_share: 0.28,
        no_share: 0.25,
        lo: 0.35,
        hi: 0.59,
        tested_price_dollars: 3.49,
        reportable: true,
        decision_ready: true,
      } as never,
    ],
    attribute_penalties: [],
    expectation_vs_experience: [],
    buy_order: [{ ref: 1, name: 'Keel Lemon Water', n: 64, first_share: 0.52 }],
    taste_why: [],
    day2: {
      preference_hold: { n: 44, same_favorite_share: 0.68 },
      consumption: [],
      wear: [],
      price_check: [
        {
          ref: 1,
          name: 'Keel Lemon Water',
          n: 44,
          yes_share: 0.41,
          maybe_share: 0.3,
          no_share: 0.29,
          lo: 0.28,
          hi: 0.55,
          tested_price_dollars: 3.49,
          reportable: true,
          decision_ready: true,
        },
      ],
    } as never,
    verdict: {
      ref: 1,
      name: 'Keel Lemon Water',
      overall: 'too_close_to_call',
      taste_win: {
        share: 0.64,
        n: 64,
        lo: 0.56,
        hi: 0.72,
        bar: 0.55,
        result: 'cleared',
      },
      liking: {
        share: 0.72,
        n: 64,
        lo: 0.61,
        hi: 0.81,
        bar: 0.6,
        result: 'cleared',
      },
      buy_at_price: {
        share: 0.47,
        n: 64,
        lo: 0.35,
        hi: 0.59,
        bar: 0.55,
        result: 'too_close_to_call',
      },
    },
    price_intent: priceIntent
      ? {
          analysis_version: 'IHUT_PRICE_V2',
          label: 'tested_offer_intent',
          interpretation:
            'Stated willingness to buy at each product’s frozen shelf price after tasting. Not demand, elasticity, conversion, or an optimal price.',
          price_check_enabled: true,
          descriptive_floor: 10,
          decision_floor: 30,
          tested_prices: [
            {
              ref: 1,
              name: 'Keel Lemon Water',
              is_yours: true,
              price_dollars: 3.49,
            },
          ],
          day1: [
            {
              ref: 1,
              name: 'Keel Lemon Water',
              n: 64,
              yes_share: 0.47,
              maybe_share: 0.28,
              no_share: 0.25,
              lo: 0.35,
              hi: 0.59,
              tested_price_dollars: 3.49,
              reportable: true,
              decision_ready: true,
            },
          ],
          day2: [
            {
              ref: 1,
              name: 'Keel Lemon Water',
              n: 44,
              yes_share: 0.41,
              maybe_share: 0.3,
              no_share: 0.29,
              lo: 0.28,
              hi: 0.55,
              tested_price_dollars: 3.49,
              reportable: true,
              decision_ready: true,
            },
          ],
          day1_to_day2: [
            {
              ref: 1,
              name: 'Keel Lemon Water',
              n_paired: 40,
              improved_share: 0.1,
              worsened_share: 0.2,
              stable_share: 0.7,
              reportable: true,
              matrix: {
                yes_yes: 16,
                yes_maybe: 4,
                yes_no: 2,
                maybe_yes: 3,
                maybe_maybe: 8,
                maybe_no: 2,
                no_yes: 1,
                no_maybe: 2,
                no_no: 2,
              },
            },
          ],
          value_leakage: [
            {
              ref: 1,
              name: 'Keel Lemon Water',
              n_first: 33,
              n_first_but_no_at_price: 8,
              share: 0.242,
              reportable: true,
            },
          ],
        }
      : ({
          analysis_version: 'IHUT_PRICE_V2',
          label: 'tested_offer_intent',
          interpretation:
            'Stated willingness to buy at each product’s frozen shelf price after tasting. Not demand, elasticity, conversion, or an optimal price.',
          price_check_enabled: false,
          tested_prices: [],
          day1: [],
          day2: [],
          day1_to_day2: [],
          value_leakage: [],
        } as const),
  }

  return {
    status: 'ok',
    is_simulated: true,
    report_id: 'ihut-1',
    mission_id: 'marketing-box-1',
    brand_id: 1,
    focal_product_id: 1,
    snapshot_date: '2026-09-18',
    computed_at: '2026-09-18T16:00:00Z',
    is_current: true,
    report: {
      focal_product: {
        product_id: 1,
        name: 'Keel Lemon Water',
        brand: 'Keel',
      },
      participation: { n_users: 64, n_claims: 64, n_sessions: 118 },
      report_stage: { stage: 'final', is_final: true },
      reliability: null,
      evidence_composition: null,
      methodology: null,
      headline_win_rate: [],
      per_opponent: null,
      choice_drivers: null,
      rank_validation: null,
      attribute_importance: null,
      repurchase_intent: null,
      experience_lift_vs_baseline: null,
      ihut_core: report,
    },
  }
}

describe('deriveDecisionStory', () => {
  it('keeps legacy Organic Garlic price as a cited headwind, not tested intent', () => {
    const story = deriveDecisionStory(legacyEnvelope())
    expect(story.family).toBe('legacy_experienced')
    expect(story.price.measured).toBe(false)
    expect(story.price.label).toBe('not_measured')
    expect(story.price.claims.some((c) => c.id === 'legacy-price-not-measured')).toBe(
      true,
    )
    expect(story.price.claims.some((c) => c.id === 'legacy-price-headwind')).toBe(
      true,
    )
    expect(story.headline).toContain('chosen more often than not')
  })

  it('surfaces tested-offer intent with Day 1, Day 2, transitions, and leakage', () => {
    const story = deriveDecisionStory(ihutEnvelope(true))
    expect(story.family).toBe('ihut_core')
    expect(story.price.measured).toBe(true)
    expect(story.price.day1[0]?.testedPriceDollars).toBe(3.49)
    expect(story.price.day1[0]?.maybeShare).toBe(0.28)
    expect(story.price.day2[0]?.yesShare).toBe(0.41)
    expect(story.price.transitions[0]?.stableShare).toBe(0.7)
    expect(story.price.valueLeakage[0]?.share).toBeCloseTo(0.242)
    expect(story.price.claims.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        'price-day1-yes',
        'price-day2-yes',
        'price-paired-change',
        'price-value-leakage',
        'price-bar',
      ]),
    )
    expect(story.price.interpretation).toContain('Not demand')
  })

  it('does not invent price evidence when checks were disabled', () => {
    const story = deriveDecisionStory(ihutEnvelope(false))
    expect(story.price.enabled).toBe(false)
    expect(story.price.claims[0]?.id).toBe('price-disabled')
  })
})
