import { describe, expect, it } from 'vitest'
import { deriveExperiencedNarrative } from '../experiencedNarrative'
import type { ExperiencedReportEnvelope } from '../types'

function envelopeWith(
  value: number | null,
  lo: number | null,
  hi: number | null,
  reportable = true,
): ExperiencedReportEnvelope {
  return {
    status: 'ok',
    is_simulated: false,
    report_id: 'report-1',
    mission_id: 'mission-1',
    brand_id: 1,
    focal_product_id: 1,
    snapshot_date: '2026-10-05',
    computed_at: '2026-10-05T12:00:00Z',
    is_current: true,
    report: {
      focal_product: {
        product_id: 1,
        name: 'Organic Garlic Powder',
        brand: 'Simply Organic',
      },
      participation: { n_users: 100, n_claims: 100, n_sessions: 100 },
      report_stage: { stage: 'final', is_final: true },
      reliability: null,
      evidence_composition: null,
      methodology: null,
      headline_win_rate: [
        {
          value,
          ci_low: lo,
          ci_high: hi,
          reportable,
          withheld_reason: reportable ? null : 'below floor',
          n_decisive: 400,
          experience_split: 'experienced_vs_experienced',
        },
      ],
      per_opponent: [],
      choice_drivers: null,
      rank_validation: null,
      attribute_importance: null,
      repurchase_intent: null,
      experience_lift_vs_baseline: null,
      ihut_core: null,
    },
  }
}

describe('deriveExperiencedNarrative', () => {
  it('calls a preference lead only when the interval clears an even split', () => {
    const narrative = deriveExperiencedNarrative(envelopeWith(0.62, 0.57, 0.67))
    expect(narrative.headline).toContain('chosen more often than not')
    expect(narrative.explanation).toContain('57%–67%')
    expect(narrative.implication).toContain('not a launch recommendation')
  })

  it('does not upgrade a favorable point estimate when the interval crosses 50%', () => {
    const narrative = deriveExperiencedNarrative(envelopeWith(0.58, 0.48, 0.66))
    expect(narrative.headline).toContain('too close to call')
    expect(narrative.implication).toContain('point estimate')
  })

  it('states when experienced preference did not lead', () => {
    const narrative = deriveExperiencedNarrative(envelopeWith(0.41, 0.34, 0.48))
    expect(narrative.tone).toBe('negative')
    expect(narrative.headline).toContain('did not lead')
  })

  it('keeps under-floor evidence visibly preliminary', () => {
    const narrative = deriveExperiencedNarrative(
      envelopeWith(null, null, null, false),
    )
    expect(narrative.headline).toContain('still forming')
    expect(narrative.implication).toContain('Missing evidence')
  })
})
