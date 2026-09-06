import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExperiencedReportDeck } from '@/components/experiencedReport/ExperiencedReportDeck'
import { parseExperiencedEnvelope } from '../parse'

const THIN_REPORT = {
  headline_win_rate: [],
  per_opponent: [],
  rank_validation: null,
  repurchase_intent: null,
  attribute_importance: null,
  choice_drivers: { by_outcome: {} },
  reliability: {
    reportable: false,
    value: null,
    withheld_reason: 'n_users_with_repeats = 0',
  },
  experience_lift_vs_baseline: {
    reportable: false,
    value: null,
    withheld_reason: 'n_with_baseline = 0',
  },
  participation: { n_users: 1, n_claims: 1, n_sessions: 1 },
  focal_product: { name: 'Best Garlic', brand: 'Acme', product_id: 42 },
  report_stage: { stage: 'final', completions_delivered: 0 },
}

describe('parseExperiencedEnvelope — honest-empty / thin study', () => {
  it('reads nested report and accepts empty headline_win_rate', () => {
    const envelope = parseExperiencedEnvelope(
      {
        status: 'ok',
        report: THIN_REPORT,
        report_id: 'r1',
        brand_id: 7,
        mission_id: 'fa4fb97f-4e3f-44e7-8c99-cf553202e1f4',
        is_current: true,
        computed_at: '2026-08-26T00:00:00Z',
        snapshot_date: '2026-08-26',
        is_simulated: false,
        focal_product_id: 42,
      },
      'fallback-id'
    )

    expect(envelope).not.toBeNull()
    expect(envelope?.status).toBe('ok')
    expect(envelope?.report.focal_product.name).toBe('Best Garlic')
    expect(envelope?.report.participation).toEqual({
      n_users: 1,
      n_claims: 1,
      n_sessions: 1,
    })
    expect(envelope?.report.headline_win_rate).toEqual([])
    expect(envelope?.report.per_opponent).toEqual([])
    expect(envelope?.report.rank_validation).toBeNull()
    expect(envelope?.report.repurchase_intent).toBeNull()
    expect(envelope?.report.attribute_importance).toBeNull()
    expect(envelope?.report.choice_drivers?.by_outcome.focal_won).toEqual([])
    expect(envelope?.report.choice_drivers?.by_outcome.focal_lost).toEqual([])
    expect(envelope?.report.reliability?.reportable).toBe(false)
    expect(envelope?.report.experience_lift_vs_baseline?.reportable).toBe(false)
    expect(envelope?.report.report_stage.stage).toBe('final')
  })

  it('still fails without a focal product name', () => {
    expect(
      parseExperiencedEnvelope(
        {
          status: 'ok',
          report: { ...THIN_REPORT, focal_product: { product_id: 1 } },
        },
        'm1'
      )
    ).toBeNull()
  })

  it('renders the deck without a page-level error', () => {
    const envelope = parseExperiencedEnvelope(
      {
        status: 'ok',
        report: THIN_REPORT,
        mission_id: 'fa4fb97f-4e3f-44e7-8c99-cf553202e1f4',
      },
      'fa4fb97f-4e3f-44e7-8c99-cf553202e1f4'
    )
    expect(envelope).not.toBeNull()
    const html = renderToString(
      createElement(ExperiencedReportDeck, { envelope: envelope! })
    )
    expect(html).not.toContain("Couldn't load report")
    expect(html).toContain('Best Garlic')
    expect(html).toContain('Acme')
    expect(html).toContain('1 person who’s had it')
    expect(html).toContain('1 session')
    expect(html).toContain('exec-strip--thin')
    expect(html).not.toContain('Chosen')
    expect(html).not.toContain("Couldn't load report")
    expect(html).toContain('Not enough responses yet to report this')
    expect(html).toContain('Against the shelf')
    expect(html).toContain('Would they buy again')
    expect(html).toContain('Did preference move')
    expect(html).toContain('What matters in the category')
    expect(html).toContain('Why they chose')
    expect(html).toContain('Does the ranking hold up')
    expect(html).toContain('Methodology &amp; exclusions')
    expect(html).toContain('report-span-6')
    expect(html).toContain('report-span-5')
    expect((html.match(/Not enough responses yet to report this/g) ?? []).length).toBeGreaterThan(3)
    expect(html).not.toContain('Chose Best Garlic')
  })
})

describe('ExperiencedReportDeck — dense 2-up occupancy', () => {
  it('keeps empty grid cells and hoists split copy once', () => {
    const envelope = parseExperiencedEnvelope(
      {
        status: 'ok',
        is_simulated: true,
        report: {
          ...THIN_REPORT,
          focal_product: { name: 'Organic Garlic Powder', brand: 'Acme', product_id: 42 },
          headline_win_rate: [
            {
              reportable: true,
              value: 0.62,
              ci_low: 0.5,
              ci_high: 0.72,
              n_decisive: 80,
              experience_split: 'experienced_vs_experienced',
            },
          ],
          per_opponent: [
            {
              opponent_name: 'Rival A',
              opponent_brand: 'X',
              reportable: true,
              value: 0.7,
              experience_split: 'experienced_vs_experienced',
            },
            {
              opponent_name: 'Rival B',
              opponent_brand: 'Y',
              reportable: true,
              value: 0.55,
              experience_split: 'experienced_vs_experienced',
            },
          ],
          choice_drivers: {
            by_outcome: {
              focal_won: [{ driver: 'Taste', share: 0.4, reportable: true }],
              focal_lost: [{ driver: 'Price', share: 0.41, reportable: true }],
            },
          },
          attribute_importance: {
            attributes: [
              {
                attribute: 'Flavor',
                bw_score: 0.32,
                reportable: true,
              },
              {
                attribute: 'Packaging',
                bw_score: -0.18,
                reportable: true,
              },
            ],
          },
          repurchase_intent: {
            by_session: [
              { session_number: 1, metric: 'definite_yes', rate: 0.4, reportable: true },
              { session_number: 1, metric: 'no', rate: 0.2, reportable: true },
              { session_number: 1, metric: 'top_two_box', rate: 0.6, reportable: true },
            ],
          },
          experience_lift_vs_baseline: {
            reportable: true,
            mean_elo_delta: 4.2,
          },
        },
      },
      '0b26e1e8-aef3-422f-bf4b-b20902e349d1'
    )
    expect(envelope).not.toBeNull()
    const html = renderToString(
      createElement(ExperiencedReportDeck, { envelope: envelope! })
    )

    expect(html).toContain('Organic Garlic Powder')
    expect(html).toContain('report-span-6')
    expect(html).toContain('What matters in the category')
    expect(html).toContain('Did preference move')
    expect(html).toContain('Not enough responses yet to report this')
    const strongest = html.match(/the strongest claim/g) ?? []
    expect(strongest.length).toBeLessThanOrEqual(2)
    expect(html).not.toContain('forced choices in this slice')
    expect(html).toContain('Rival A')
    expect(html).toContain('Rival B')
    expect(html).toContain('When they chose you')
    expect(html).toContain('Chosen 62 of 100 times')
    expect(html).toContain('40% would definitely buy again')
    expect(html).toContain('Taste')
    expect(html).toContain('share-bar--own')
    expect(html).toContain('share-bar--against')
    expect(html).toContain('Price')
    expect(html).toContain('exec-tiles')
    expect(html).toContain('exec-tile--own')
    expect(html).toContain('exec-tile--against')
    expect(html).toContain('bipolar-track')
    expect(html).toContain('Objectionable')
    expect(html).toContain('Compelling')
    expect(html).toContain('loyalty-numeral--own')
    expect(html).toContain('loyalty-numeral--against')
    expect(html).toContain('loyalty-numeral--neutral')
    expect(html).toContain('lift-numeral--own')
    expect(html).toContain('Does the ranking hold up')
  })
})

