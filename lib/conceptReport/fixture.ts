import type { ConceptMissionReport } from './types'

/** Confident / tie fixture for ?preview=1 */
export function conceptReportFixture(missionId = 'fixture-mission'): ConceptMissionReport {
  return {
    id: 'fixture-report',
    mission_id: missionId,
    study_title: 'Sparkling lemonade — three concepts vs shelf',
    category_label: 'Sparkling beverages',
    price_posture_label: 'Prices shown',
    prices_shown: true,
    report_maturity: 'preliminary',
    snapshot_date: '2026-07-10',
    computed_at: '2026-07-10T18:22:00.000Z',
    is_current: true,
    n_concepts: 3,
    n_products: 2,
    n_respondents: 48,
    n_decisive_battles: 312,
    n_neither: 18,
    neither_rate: 0.055,
    n_combatants: 5,
    win_rate_field: [
      {
        combatant_ref: 1,
        display_name: 'Citrus Grove',
        battle_intent: 'own_concept_arm',
        kind: 'concept',
        rank: 1,
        placeable: true,
        win_rate_of_100: 58,
        win_rate_lo: 46,
        win_rate_hi: 69,
        frozen_price: 3.49,
      },
      {
        combatant_ref: 4,
        display_name: 'Olipop Lemon Lime',
        battle_intent: 'jtbd_incumbent',
        kind: 'product',
        rank: 2,
        placeable: true,
        win_rate_of_100: 55,
        win_rate_lo: 43,
        win_rate_hi: 66,
        frozen_price: 3.99,
      },
      {
        combatant_ref: 2,
        display_name: 'Sunspill',
        battle_intent: 'own_concept_arm',
        kind: 'concept',
        rank: 3,
        placeable: true,
        win_rate_of_100: 49,
        win_rate_lo: 38,
        win_rate_hi: 61,
        frozen_price: 3.49,
      },
      {
        combatant_ref: 5,
        display_name: 'Spindrift Lemon',
        battle_intent: 'direct_competitor',
        kind: 'product',
        rank: 4,
        placeable: true,
        win_rate_of_100: 44,
        win_rate_lo: 33,
        win_rate_hi: 55,
        frozen_price: 2.49,
      },
      {
        combatant_ref: 3,
        display_name: 'Zest Line',
        battle_intent: 'own_concept_arm',
        kind: 'concept',
        rank: 5,
        placeable: true,
        win_rate_of_100: 38,
        win_rate_lo: 28,
        win_rate_hi: 49,
        frozen_price: 3.29,
      },
    ],
    finding: {
      top: {
        combatant_ref: 1,
        display_name: 'Citrus Grove',
        kind: 'concept',
        battle_intent: 'own_concept_arm',
        win_rate_of_100: 58,
      },
      relationship_to_field: 'concept_ahead_of_some_products',
      is_tie: true,
      is_thin: false,
      tie_with: {
        combatant_ref: 4,
        display_name: 'Olipop Lemon Lime',
        kind: 'product',
        battle_intent: 'jtbd_incumbent',
        win_rate_of_100: 55,
      },
      suggested_additional_respondents: 40,
      note: 'These results report what respondents chose in this head-to-head test. They are not a forecast of sales or a recommendation to launch.',
      decision_frame: {
        posture: 'tie_break_needed',
        action: 'Collect about 40 more respondents',
        rationale:
          'Citrus Grove and Olipop Lemon Lime sit in overlapping ranges. Don’t force a single winner — field more people or take both into qual.',
        headline_kind: 'provisional',
      },
    },
    decision_frame: {
      posture: 'tie_break_needed',
      action: 'Collect about 40 more respondents',
      rationale:
        'Citrus Grove and Olipop Lemon Lime sit in overlapping ranges. Don’t force a single winner — field more people or take both into qual.',
      headline_kind: 'provisional',
    },
    top_pair_record: {
      display_name: 'Citrus Grove',
      kind: 'concept',
      battle_intent: 'own_concept_arm',
      combatant_ref: 1,
      vs: [
        {
          opponent_ref: 4,
          opponent_name: 'Olipop Lemon Lime',
          opponent_kind: 'product',
          opponent_intent: 'jtbd_incumbent',
          top_wins: 11,
          opponent_wins: 12,
          shown: 23,
        },
        {
          opponent_ref: 2,
          opponent_name: 'Sunspill',
          opponent_kind: 'concept',
          opponent_intent: 'own_concept_arm',
          top_wins: 14,
          opponent_wins: 8,
          shown: 22,
        },
        {
          opponent_ref: 5,
          opponent_name: 'Spindrift Lemon',
          opponent_kind: 'product',
          opponent_intent: 'direct_competitor',
          top_wins: 15,
          opponent_wins: 7,
          shown: 22,
        },
        {
          opponent_ref: 3,
          opponent_name: 'Zest Line',
          opponent_kind: 'concept',
          opponent_intent: 'own_concept_arm',
          top_wins: 16,
          opponent_wins: 5,
          shown: 21,
        },
      ],
    },
    position_bias_check: {
      shown_first_win_rate: 0.51,
      gap_from_0_5: 0.01,
      note: 'Near 50% means card position didn’t drive who won.',
    },
    achieved_pair_coverage: {
      mean_shown: 22,
      min_shown: 18,
      max_shown: 26,
      note: 'Every pairing tested — no matchup starved of data.',
    },
    connectivity: {
      fully_connected: true,
      n_components: 1,
      note: 'All competitors connected through the battles.',
    },
    design_effect_summary: {
      mean_design_effect: 2.4,
      n_clusters: 48,
      interpretation:
        'Cluster-robust intervals account for one person’s battles being correlated. We report the honest width.',
    },
    question_responses: [
      {
        question_type_code: 'concept_diagnostic',
        display_name: 'Why this one',
        prompt: 'What most drew you to the one you chose?',
        session_number: 1,
        position: 1,
        signal_kind: 'categorical_distribution',
        framing_note:
          'What respondents said drew them in — stated reasons, not proven causes.',
        aggregate: {
          n_answers: 16,
          distribution: { health: 6, taste: 5, price: 3, packaging: 2 },
          shares: { health: 0.375, taste: 0.3125, price: 0.1875, packaging: 0.125 },
        },
      },
      {
        question_type_code: 'concept_floor',
        display_name: 'Purchase intent',
        prompt: 'Would you buy this if you saw it on shelf at this price?',
        session_number: 1,
        position: 2,
        signal_kind: 'intent_scale',
        framing_note: 'Stated intent, not a forecast of sales.',
        aggregate: {
          n_answers: 16,
          distribution: { yes: 5, maybe: 7, no: 4 },
          shares: { yes: 0.3125, maybe: 0.4375, no: 0.25 },
          presentation_rule:
            'Stated intent under test conditions — not a prediction of purchase or market share.',
        },
      },
      {
        question_type_code: 'concept_screener',
        display_name: 'Category frequency',
        prompt: 'How often do you buy sparkling beverages?',
        session_number: 1,
        position: 0,
        signal_kind: 'screening_context',
        framing_note: 'This describes your respondents, not a result about the product.',
        aggregate: {
          n_answers: 16,
          distribution: { weekly: 8, monthly: 5, rarely: 3 },
          shares: { weekly: 0.5, monthly: 0.3125, rarely: 0.1875 },
        },
      },
    ],
    min_cluster_warning: '',
    is_simulated: false,
  }
}

/** Thin-sample fixture — early-read must dominate; no cocky verdict. */
export function conceptReportThinSampleFixture(
  missionId = 'fixture-mission-thin'
): ConceptMissionReport {
  const base = conceptReportFixture(missionId)
  return {
    ...base,
    study_title: 'Sparkling lemonade — early field (thin sample)',
    n_respondents: 1,
    n_decisive_battles: 6,
    min_cluster_warning:
      'Fewer than the minimum respondent clusters for stable intervals. Treat rankings as directional only.',
    win_rate_field: base.win_rate_field.map((row) => ({
      ...row,
      placeable: false,
      win_rate_lo: null,
      win_rate_hi: null,
    })),
    finding: {
      ...base.finding,
      is_tie: false,
      is_thin: true,
      tie_with: null,
      suggested_additional_respondents: null,
      relationship_to_field: 'concept_leads_field',
      top: { ...base.finding.top, win_rate_of_100: 72 },
      decision_frame: {
        posture: 'early_read',
        action: 'Collect more respondents',
        rationale:
          'With only one respondent, point rankings have no reliable margin. Wait until intervals appear.',
        headline_kind: 'provisional',
      },
    },
    decision_frame: {
      posture: 'early_read',
      action: 'Collect more respondents',
      rationale:
        'With only one respondent, point rankings have no reliable margin. Wait until intervals appear.',
      headline_kind: 'provisional',
    },
    top_pair_record: null,
    is_simulated: false,
  }
}
