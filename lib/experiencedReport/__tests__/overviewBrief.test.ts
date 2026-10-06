import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExperiencedStoryReport } from '@/components/experiencedReport/ExperiencedStoryReport'
import { deriveOverviewBrief } from '../overviewBrief'
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
          ci_low: 0.51,
          ci_high: 0.65,
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
          value: 0.56,
          ci_low: 0.48,
          ci_high: 0.64,
          n_decisive: 100,
          n_wins: 56,
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
      repurchase_intent: {
        by_session: [
          {
            session_number: 1,
            metric: 'definite_yes',
            rate: 0.51,
            reportable: true,
            value: 0.51,
            ci_low: null,
            ci_high: null,
            withheld_reason: null,
          },
          {
            session_number: 1,
            metric: 'top_two_box',
            rate: 0.79,
            reportable: true,
            value: 0.79,
            ci_low: null,
            ci_high: null,
            withheld_reason: null,
          },
          {
            session_number: 1,
            metric: 'no',
            rate: 0.21,
            reportable: true,
            value: 0.21,
            ci_low: null,
            ci_high: null,
            withheld_reason: null,
          },
        ],
      },
      experience_lift_vs_baseline: null,
      ihut_core: null,
    },
  }
}

describe('deriveOverviewBrief — Organic Garlic', () => {
  it('answers the four brand questions from existing data', () => {
    const overview = deriveOverviewBrief(garlicEnvelope())
    expect(overview.bottomLine).toBe(
      'Organic Garlic Powder won the choice test.',
    )
    expect(overview.call).toBe('ahead')
    expect(overview.preferencePct).toBe('62%')
    expect(overview.tiles.find((t) => t.id === 'field')?.detail).toMatch(
      /Preferred in/,
    )
    expect(overview.tiles.find((t) => t.id === 'why')?.value).toMatch(/Taste/i)
    expect(overview.tiles.find((t) => t.id === 'intent')?.value).toBe('51%')
    expect(overview.tiles.find((t) => t.id === 'price')?.value).toBe(
      'Price not tested',
    )
    expect(overview.interpretation).toMatch(/taste/)
    expect(overview.interpretation).toMatch(/price/)
    expect(overview.proofTitle).toMatch(/soft spot|cleared even/i)
    expect(overview.whyTitle).toMatch(/Taste is the win condition/i)
    expect(overview.supports.length).toBeGreaterThan(0)
    expect(overview.doesNotSupport.some((c) => /price/i.test(c.text))).toBe(
      true,
    )
  })
})

describe('Overview Bottom Line SSR', () => {
  it('puts the decision in the first viewport', () => {
    const html = renderToString(
      createElement(ExperiencedStoryReport, {
        envelope: garlicEnvelope(),
        backHref: '/studies',
      }),
    )
    expect(html).toContain('The bottom line')
    expect(html).toContain('Organic Garlic Powder won the choice test.')
    expect(html).toContain('chosen after use')
    expect(html).toContain('Against the field')
    expect(html).toContain('Why it wins')
    expect(html).toContain('Would they buy again?')
    expect(html).toContain('Price not tested')
    expect(html).toContain('51%')
    expect(html).toContain('See the proof')
    expect(html).toContain('What this supports')
    expect(html).toContain('What this does not support')
    expect(html).toContain('Win condition')
    expect(html).toContain('Not reportable yet')
    expect(html).not.toMatch(/list at \$|optimal list price/i)
  })
})
