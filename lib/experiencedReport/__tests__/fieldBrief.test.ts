import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import {
  deriveFieldBrief,
  derivePreferenceBrief,
  derivePriceBriefTile,
} from '../fieldBrief'
import { deriveDecisionStory } from '../decisionStory'
import { ExperiencedStoryReport } from '@/components/experiencedReport/ExperiencedStoryReport'
import type { ExperiencedReportEnvelope } from '../types'

function garlicEnvelope(): ExperiencedReportEnvelope {
  return {
    status: 'ok',
    is_simulated: true,
    report_id: 'legacy-garlic',
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
      per_opponent: [
        {
          opponent_product_id: 2,
          opponent_name: 'McCormick Garlic Powder',
          opponent_brand: 'McCormick',
          reportable: true,
          value: 0.71,
          ci_low: 0.62,
          ci_high: 0.79,
          n_decisive: 120,
          n_wins: 85,
          experience_split: 'experienced_vs_experienced',
          withheld_reason: null,
        },
        {
          opponent_product_id: 3,
          opponent_name: 'Badia Garlic Powder',
          opponent_brand: 'Badia',
          reportable: true,
          value: 0.58,
          ci_low: 0.49,
          ci_high: 0.67,
          n_decisive: 110,
          n_wins: 64,
          experience_split: 'experienced_vs_experienced',
          withheld_reason: null,
        },
        {
          opponent_product_id: 4,
          opponent_name: 'Spice Islands Garlic',
          opponent_brand: 'Spice Islands',
          reportable: true,
          value: 0.52,
          ci_low: 0.43,
          ci_high: 0.61,
          n_decisive: 100,
          n_wins: 52,
          experience_split: 'experienced_vs_experienced',
          withheld_reason: null,
        },
      ],
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

describe('fieldBrief', () => {
  it('marks Garlic ahead and surfaces beat most / least with W–L', () => {
    const envelope = garlicEnvelope()
    const preference = derivePreferenceBrief({
      share: 0.62,
      lo: 0.57,
      hi: 0.67,
      nDecisive: 400,
      direction: 'more',
    })
    expect(preference.call).toBe('ahead')
    expect(preference.callLabel).toBe('Ahead in field')

    const field = deriveFieldBrief(envelope.report.per_opponent)
    expect(field.beatMost?.opponentName).toBe('McCormick Garlic Powder')
    expect(field.beatMost?.nWins).toBe(85)
    expect(field.beatLeast?.opponentName).toBe('Spice Islands Garlic')
    expect(field.beatLeast?.nWins).toBe(52)
    expect(field.rows[0]?.call).toBe('win')
  })

  it('keeps price as not measured for legacy Garlic', () => {
    const story = deriveDecisionStory(garlicEnvelope())
    const price = derivePriceBriefTile(story)
    expect(price.status).toBe('not_measured')
    expect(price.priceLabel).toBeNull()
    expect(price.detail).toMatch(/Cited against the product 40%/)
  })
})

describe('DecisionBrief visuals — Organic Garlic', () => {
  it('SSR header answers call, H2H extremes, and price-not-tested', () => {
    const html = renderToString(
      createElement(ExperiencedStoryReport, {
        envelope: garlicEnvelope(),
        backHref: '/studies',
      }),
    )
    expect(html).toContain('Won')
    expect(html).toContain('won the choice test')
    expect(html).toContain('Beat most')
    expect(html).toContain('McCormick Garlic Powder')
    expect(html).toContain('Beat least')
    expect(html).toContain('Spice Islands Garlic')
    expect(html).toContain('Price not tested')
    expect(html).toContain('85–35')
    expect(html).toContain('W–L')
    expect(html).toContain('Do not infer')
    expect(html).not.toMatch(/list at \$|recommended price|optimal list price/i)
  })
})
