import { describe, expect, it } from 'vitest'
import { parseExperiencedEnvelope } from '../parse'
import {
  asUnit,
  deriveExecutiveSummary,
  pickTopDriver,
} from '../executiveSummary'
import { orderedHeadlineRows, leadHeadlineRow } from '../headline'
import type { DriverRow } from '../types'

const BASE_REPORT = {
  headline_win_rate: [] as unknown[],
  per_opponent: [],
  rank_validation: null,
  repurchase_intent: null,
  attribute_importance: null,
  choice_drivers: { by_outcome: {} },
  participation: { n_users: 1, n_claims: 1, n_sessions: 1 },
  focal_product: { name: 'Best Garlic', brand: 'Acme', product_id: 42 },
  report_stage: { stage: 'final', completions_delivered: 0 },
}

function envelopeOf(report: Record<string, unknown>) {
  return parseExperiencedEnvelope(
    { status: 'ok', report: { ...BASE_REPORT, ...report } },
    'm1'
  )!
}

describe('asUnit', () => {
  it('leaves 0–1 rates alone and folds 0–100 into unit scale', () => {
    expect(asUnit(0.64)).toBe(0.64)
    expect(asUnit(1)).toBe(1)
    expect(asUnit(64)).toBe(0.64)
    expect(asUnit(9.4)).toBeCloseTo(0.094)
  })
})

describe('orderedHeadlineRows', () => {
  it('never uses a bare first-row of the raw array', () => {
    const rows = orderedHeadlineRows([
      { experience_split: 'experienced_vs_hypothetical', reportable: true, value: 0.4, ci_low: null, ci_high: null, withheld_reason: null },
      { experience_split: 'experienced_vs_experienced', reportable: true, value: 0.64, ci_low: null, ci_high: null, withheld_reason: null },
    ])
    expect(leadHeadlineRow(rows)?.experience_split).toBe('experienced_vs_experienced')
    expect(leadHeadlineRow([])).toBeNull()
  })
})

describe('pickTopDriver', () => {
  it('qualifies reportable rows even when n_citing is null', () => {
    const rows: DriverRow[] = [
      { driver: 'Taste', share: 0.36, reportable: true, value: 0.36, ci_low: null, ci_high: null, withheld_reason: null, n_citing: null },
      { driver: 'Price', share: 0.3, reportable: true, value: 0.3, ci_low: null, ci_high: null, withheld_reason: null, n_citing: null },
    ]
    expect(pickTopDriver(rows)?.driver).toBe('Taste')
  })

  it('prefers n_citing > 0 when present, then alphabetical on ties', () => {
    const rows: DriverRow[] = [
      { driver: 'Zebra', share: 0.4, reportable: true, value: 0.4, ci_low: null, ci_high: null, withheld_reason: null, n_citing: 2 },
      { driver: 'Apple', share: 0.4, reportable: true, value: 0.4, ci_low: null, ci_high: null, withheld_reason: null, n_citing: 2 },
      { driver: 'Quiet', share: 0.9, reportable: true, value: 0.9, ci_low: null, ci_high: null, withheld_reason: null, n_citing: 0 },
    ]
    expect(pickTopDriver(rows)?.driver).toBe('Apple')
  })

  it('ignores unreportable rows', () => {
    const rows: DriverRow[] = [
      { driver: 'Nope', share: 0.9, reportable: false, value: 0.9, ci_low: null, ci_high: null, withheld_reason: 'floor', n_citing: 9 },
    ]
    expect(pickTopDriver(rows)).toBeNull()
  })
})

describe('deriveExecutiveSummary', () => {
  it('collapses a thin n=1 report — Tile 5 does not keep the strip alive', () => {
    const summary = deriveExecutiveSummary(envelopeOf({}))
    expect(summary.mode).toBe('thin')
    expect(summary.synthesis).toBeNull()
    expect(summary.confidence).toBe('No headline yet')
    expect(summary.participationLine).toBe('1 person who’s had it · 1 session')
    expect(summary.chosenOf100).toBeNull()
  })

  it('matches the dense contract: 64/100, 61/82, Taste/Price, High confidence', () => {
    const summary = deriveExecutiveSummary(
      envelopeOf({
        focal_product: { name: 'Organic Garlic Powder', brand: 'Acme', product_id: 1 },
        headline_win_rate: [
          {
            reportable: true,
            value: 0.64,
            ci_low: 0.59,
            ci_high: 0.684,
            n_decisive: 80,
            experience_split: 'experienced_vs_experienced',
          },
        ],
        choice_drivers: {
          by_outcome: {
            focal_won: [{ driver: 'Taste', share: 0.36, reportable: true }],
            focal_lost: [{ driver: 'Price', share: 0.41, reportable: true }],
          },
        },
        repurchase_intent: {
          by_session: [
            { session_number: 1, metric: 'definite_yes', rate: 0.61, reportable: true, ci_low: 0.51, ci_high: 0.7 },
            { session_number: 1, metric: 'top_two_box', rate: 0.82, reportable: true },
            { session_number: 1, metric: 'no', rate: 0.1, reportable: true },
          ],
        },
      })
    )
    expect(summary.mode).toBe('strip')
    expect(summary.chosenOf100).toBe(64)
    expect(summary.ciLow100).toBe(59)
    expect(summary.ciHigh100).toBe(68)
    expect(summary.confidence).toBe('High confidence')
    expect(summary.definiteYes?.rate).toBe(0.61)
    expect(summary.topTwoBox?.rate).toBe(0.82)
    expect(summary.topDriver?.driver).toBe('Taste')
    expect(summary.topHeadwind?.driver).toBe('Price')
    expect(summary.direction).toBe('more')
    expect(summary.synthesis).toContain('Organic Garlic Powder was chosen more often than not')
    expect(summary.synthesis).toContain('64 of 80 forced choices')
    expect(summary.synthesis).toContain('Taste was the leading reason for choice')
    expect(summary.synthesis).toContain('Price was the leading reason against')
    expect(summary.synthesis).toContain('61% would definitely buy again (82% yes or maybe)')
  })

  it('still reads High confidence when CI is stored on 0–100', () => {
    const summary = deriveExecutiveSummary(
      envelopeOf({
        headline_win_rate: [
          {
            reportable: true,
            value: 64,
            ci_low: 59,
            ci_high: 68.4,
            n_decisive: 80,
            experience_split: 'experienced_vs_experienced',
          },
        ],
      })
    )
    expect(summary.chosenOf100).toBe(64)
    expect(summary.confidence).toBe('High confidence')
    expect(summary.mode).toBe('strip')
  })

  it('never headlines top-two-box; TTB-only session withholds buy-again', () => {
    const summary = deriveExecutiveSummary(
      envelopeOf({
        repurchase_intent: {
          by_session: [
            { session_number: 1, metric: 'top_two_box', rate: 0.82, reportable: true },
          ],
        },
      })
    )
    expect(summary.definiteYes).toBeNull()
    expect(summary.topTwoBox).toBeNull()
    expect(summary.mode).toBe('thin')
  })

  it('drops synthesis when the headline is not reportable', () => {
    const summary = deriveExecutiveSummary(
      envelopeOf({
        headline_win_rate: [
          {
            reportable: false,
            value: 0.64,
            withheld_reason: 'n_decisive = 4 < 30',
            experience_split: 'experienced_vs_experienced',
          },
        ],
        choice_drivers: {
          by_outcome: {
            focal_won: [{ driver: 'Taste', share: 0.4, reportable: true }],
          },
        },
      })
    )
    expect(summary.synthesis).toBeNull()
    expect(summary.confidence).toBe('Below reporting floor')
    expect(summary.mode).toBe('strip')
    expect(summary.topDriver?.driver).toBe('Taste')
  })
})
