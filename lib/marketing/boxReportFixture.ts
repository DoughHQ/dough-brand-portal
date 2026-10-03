import { parseExperiencedEnvelope } from '@/lib/experiencedReport/parse'
import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'

/** Simulated in-home box report for godough.co embeds. Not a client study. */
const MARKETING_BOX_REPORT_RAW = {
  status: 'ok',
  is_simulated: true,
  report_id: 'marketing-box-report',
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
    participation: {
      n_users: 64,
      n_claims: 64,
      n_sessions: 118,
    },
    report_stage: {
      stage: 'final',
      is_final: true,
      mission_status: 'complete',
      target_completions: 80,
      completions_delivered: 64,
      stage_semantics: 'Final report — fielding closed.',
    },
    reliability: {
      reportable: true,
      value: 0.78,
      ci_low: 0.68,
      ci_high: 0.86,
      withheld_reason: null,
      consistency_rate: 0.78,
      n_users_with_repeats: 42,
      scope_note: 'Consistency among people who repeated a decisive choice.',
    },
    headline_win_rate: [
      {
        reportable: true,
        value: 0.58,
        ci_low: 0.5,
        ci_high: 0.66,
        n_decisive: 96,
        experience_split: 'experienced_vs_experienced',
        withheld_reason: null,
      },
    ],
    per_opponent: [
      {
        opponent_product_id: 11,
        opponent_name: 'Rivermark Citrus Still',
        opponent_brand: 'Rivermark',
        reportable: true,
        value: 0.62,
        ci_low: 0.5,
        ci_high: 0.73,
        n_decisive: 48,
        experience_split: 'experienced_vs_experienced',
        withheld_reason: null,
      },
      {
        opponent_product_id: 12,
        opponent_name: 'Northveil Lemon',
        opponent_brand: 'Northveil',
        reportable: true,
        value: 0.54,
        ci_low: 0.42,
        ci_high: 0.66,
        n_decisive: 48,
        experience_split: 'experienced_vs_experienced',
        withheld_reason: null,
      },
    ],
    choice_drivers: {
      by_outcome: {
        focal_won: [
          { driver: 'Taste', share: 0.38, reportable: true, value: 0.38, ci_low: null, ci_high: null, withheld_reason: null },
          { driver: 'Clean finish', share: 0.24, reportable: true, value: 0.24, ci_low: null, ci_high: null, withheld_reason: null },
        ],
        focal_lost: [
          { driver: 'Price', share: 0.41, reportable: true, value: 0.41, ci_low: null, ci_high: null, withheld_reason: null },
          { driver: 'Familiarity', share: 0.22, reportable: true, value: 0.22, ci_low: null, ci_high: null, withheld_reason: null },
        ],
      },
      timing_note: 'Choices after people had the product at home — not a shelf glance.',
      presentation_control: 'Same pack art and price frame for every session.',
    },
    attribute_importance: {
      attributes: [
        { attribute: 'Taste', bw_score: 0.34, reportable: true, value: 0.34, ci_low: null, ci_high: null, withheld_reason: null },
        { attribute: 'Value', bw_score: 0.12, reportable: true, value: 0.12, ci_low: null, ci_high: null, withheld_reason: null },
        { attribute: 'Packaging', bw_score: -0.08, reportable: true, value: -0.08, ci_low: null, ci_high: null, withheld_reason: null },
      ],
    },
    repurchase_intent: {
      by_session: [
        {
          session_number: 1,
          metric: 'definite_yes',
          rate: 0.47,
          reportable: true,
          value: 0.47,
          ci_low: 0.35,
          ci_high: 0.59,
          withheld_reason: null,
        },
        {
          session_number: 1,
          metric: 'top_two_box',
          rate: 0.72,
          reportable: true,
          value: 0.72,
          ci_low: null,
          ci_high: null,
          withheld_reason: null,
        },
        {
          session_number: 1,
          metric: 'no',
          rate: 0.14,
          reportable: true,
          value: 0.14,
          ci_low: null,
          ci_high: null,
          withheld_reason: null,
        },
        {
          session_number: 2,
          metric: 'definite_yes',
          rate: 0.41,
          reportable: true,
          value: 0.41,
          ci_low: 0.28,
          ci_high: 0.55,
          withheld_reason: null,
        },
        {
          session_number: 2,
          metric: 'top_two_box',
          rate: 0.66,
          reportable: true,
          value: 0.66,
          ci_low: null,
          ci_high: null,
          withheld_reason: null,
        },
      ],
    },
    rank_validation: {
      by_pair_class: [
        {
          pair_class: 'battled',
          reportable: true,
          agreement_rate: 0.71,
          value: 0.71,
          ci_low: 0.58,
          ci_high: 0.82,
          n_agree: 34,
          n_disagree: 14,
          n_determinate: 48,
          withheld_reason: null,
        },
      ],
    },
    experience_lift_vs_baseline: {
      reportable: true,
      value: 3.4,
      mean_elo_delta: 3.4,
      ci_low: 0.8,
      ci_high: 6.1,
      withheld_reason: null,
    },
    methodology: {
      multiple_comparison_note:
        'Opponents are reported separately. Do not average win rates across the shelf.',
    },
  },
}

export function marketingBoxReportEnvelope(): ExperiencedReportEnvelope | null {
  return parseExperiencedEnvelope(MARKETING_BOX_REPORT_RAW, 'marketing-box-1')
}
