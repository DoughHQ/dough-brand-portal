import { describe, expect, it } from 'vitest'
import { parseCategoryReport } from '../categoryReport/parse'
import { focalLeadSentence, statisticsHeadline, uniqueCiNotes, claimLines, claimCaption, focalPairRows } from '../categoryReport/copy'
import { previewDashboardHref, readinessPreviewHref, overviewPreviewHref, brandCategoryOverviewHref } from '../categoryReport/href'
import { componentAxis } from '../../components/categoryDashboard/EloWhisker'
import type { RankedProduct } from '../categoryReport/types'

describe('parseCategoryReport', () => {
  it('keeps missing elo_lo as null, never 0', () => {
    const report = parseCategoryReport({
      meta: { scope: 'l2', scope_id: 1, scope_name: 'Yogurt', elo_note: 'Elo is a display transform.' },
      evidence: { distinct_raters: 1, battles: 4, products_battled: 2, rater_threshold: 50 },
      catalog: [{ product_id: 9, name: 'Chobani', brand: 'Chobani' }],
      gate: { passes: false, reason: 'below_rater_floor', message: 'Need more raters.' },
      ranking: {
        primary_component_id: 1,
        components: [
          {
            component_id: 1,
            is_primary: true,
            size: 1,
            products: [
              {
                rank: 1,
                product_id: 9,
                name: 'Chobani',
                brand: 'Chobani',
                elo: 1012,
                ci_available: false,
                ci_note: 'single_cluster -- population CI undefined',
              },
            ],
          },
        ],
        undefeated: [],
        winless: [],
      },
      focal: null,
    })
    expect(report).not.toBeNull()
    const row = report!.ranking!.components[0].products[0]
    expect(row.elo).toBe(1012)
    expect(row.elo_lo).toBeNull()
    expect(row.elo_hi).toBeNull()
    expect(row.ci_available).toBe(false)
    expect(row.ci_note).toContain('single_cluster')
  })

  it('preserves ranking: null in brand-below-floor payloads', () => {
    const report = parseCategoryReport({
      meta: { scope: 'l2', scope_id: 1, scope_name: 'Yogurt', mode: 'brand' },
      evidence: { distinct_raters: 3, rater_threshold: 50 },
      catalog: [{ product_id: 1, name: 'A' }],
      gate: { passes: false, reason: 'below_rater_floor', message: 'Not enough people.' },
      ranking: null,
      focal: null,
    })
    expect(report?.ranking).toBeNull()
    expect(report?.catalog).toEqual([{ product_id: 1, name: 'A', brand: null }])
    expect(report?.gate.message).toBe('Not enough people.')
    expect(report?.statistics).toBeNull()
    expect(report?.pairwise).toBeNull()
    expect(report?.evidence.coverage).toBeNull()
  })

  it('parses statistics, pairwise, and evidence instrumentation without casting', () => {
    const report = parseCategoryReport({
      meta: { scope: 'l2', scope_id: 1, scope_name: 'Sauces', mode: 'admin' },
      evidence: {
        distinct_raters: 1,
        battles: 20,
        products_battled: 8,
        rater_threshold: 50,
        coverage: {
          products_ranked: 41,
          products_with_battles: 41,
          products_active_in_scope: 42730,
          note: 'Counts, not a rate.',
        },
        concentration: { top3_battle_share: 0.41, battles_per_product_median: 2, note: 'Top-heavy.' },
        rater_concentration: {
          max_single_rater_share: null,
          note: 'Need ≥2 raters.',
        },
        position_balance: {
          instrumented_battles: 12,
          left_slot_win_share: null,
          note: 'Need ≥30 instrumented battles.',
        },
      },
      catalog: [],
      gate: { passes: false, reason: 'below_rater_floor', message: 'Thin.' },
      ranking: null,
      focal: null,
      statistics: {
        model: 'Bradley-Terry (MM), cluster-robust variance clustered on rater',
        elo_transform: 'elo = 1500 + (400/ln10) * beta',
        n_clusters: 1,
        design_effect_mean: null,
        design_effect_note: 'Undefined at 1 cluster.',
        effective_n_total: null,
        components_found: 3,
        separated_items: 38,
        items_with_ci: 0,
        items_total: 41,
      },
      pairwise: {
        note: 'P from the fitted model.',
        pairs: [
          {
            a_product_id: 1,
            a_name: 'A',
            b_product_id: 2,
            b_name: 'B',
            component_id: 1,
            p_a_beats_b: 0.72,
            observed_a_wins: 3,
            observed_b_wins: 1,
            observed_n: 4,
            directly_compared: true,
          },
          {
            a_product_id: 1,
            a_name: 'A',
            b_product_id: 3,
            b_name: 'C',
            component_id: 1,
            p_a_beats_b: 0.61,
            observed_a_wins: 0,
            observed_b_wins: 0,
            observed_n: 0,
            directly_compared: false,
          },
        ],
      },
    })
    expect(report?.statistics?.items_total).toBe(41)
    expect(report?.statistics?.items_with_ci).toBe(0)
    expect(report?.statistics?.design_effect_mean).toBeNull()
    expect(report?.statistics?.design_effect_note).toContain('1 cluster')
    expect(report?.evidence.coverage?.products_active_in_scope).toBe(42730)
    expect(report?.evidence.rater_concentration?.max_single_rater_share).toBeNull()
    expect(report?.evidence.rater_concentration?.note).toContain('≥2')
    expect(report?.evidence.position_balance?.left_slot_win_share).toBeNull()
    expect(report?.pairwise?.pairs).toHaveLength(2)
    expect(report?.pairwise?.pairs[1]?.directly_compared).toBe(false)
    expect(report?.ranking).toBeNull()
  })
})

describe('focalLeadSentence', () => {
  it('uses only the three counts', () => {
    expect(focalLeadSentence(0, 4, 9)).toBe(
      'Indistinguishable from 4 products, measurably ahead of 9.'
    )
  })
})

describe('preview hrefs', () => {
  it('omits focal when none is selected', () => {
    expect(previewDashboardHref({ scope: 'l2', id: 9220001, mode: 'admin' })).toBe(
      '/admin/report-preview?scope=l2&id=9220001&mode=admin'
    )
    expect(readinessPreviewHref('l3', 9330001)).toBe(
      '/admin/report-preview?scope=l3&id=9330001&mode=admin'
    )
    expect(overviewPreviewHref('l2', 9220001)).toBe(
      '/admin/report-preview?scope=l2&id=9220001&mode=brand'
    )
    expect(brandCategoryOverviewHref(9220001)).toBe('/categories/9220001')
    expect(brandCategoryOverviewHref(9220001, 42)).toBe('/categories/9220001?focal=42')
  })
})

function p(partial: Partial<RankedProduct>): RankedProduct {
  return {
    rank: 1,
    product_id: 1,
    name: 'X',
    brand: null,
    image_url: null,
    elo: null,
    elo_lo: null,
    elo_hi: null,
    beta: null,
    se_cluster: null,
    n_decisions: 1,
    n_raters: 1,
    is_focal: false,
    is_suppressed: false,
    ci_available: false,
    ci_note: null,
    note: null,
    component_id: 1,
    ...partial,
  }
}

describe('componentAxis', () => {
  it('builds an axis from points when no row has an interval', () => {
    const axis = componentAxis([
      p({ elo: 1000, ci_available: false, elo_lo: 0, elo_hi: 0 }),
      p({ product_id: 2, elo: 1100, ci_available: false }),
    ])
    expect(axis).not.toBeNull()
    expect(axis!.min).toBeLessThan(1000)
    expect(axis!.max).toBeGreaterThan(1100)
  })

  it('does not treat zero-width intervals as extra domain when they equal elo', () => {
    const axis = componentAxis([p({ elo: 1000, ci_available: true, elo_lo: 1000, elo_hi: 1000 })])
    expect(axis).not.toBeNull()
    expect(axis!.max).toBeGreaterThan(axis!.min)
  })
})

describe('statisticsHeadline', () => {
  it('assembles payload counts and skips nulls', () => {
    expect(
      statisticsHeadline({
        items_total: 41,
        separated_items: 38,
        components_found: 3,
        items_with_ci: 0,
      })
    ).toBe('41 items · 38 separated · 3 components · 0 with intervals')
  })
})

describe('uniqueCiNotes', () => {
  it('dedupes unavailable-interval notes', () => {
    expect(
      uniqueCiNotes([
        p({ ci_available: false, ci_note: 'single_cluster — population CI undefined' }),
        p({ product_id: 2, ci_available: false, ci_note: 'single_cluster — population CI undefined' }),
        p({ product_id: 3, ci_available: true, ci_note: 'ok' }),
      ])
    ).toEqual(['single_cluster — population CI undefined'])
  })
})

describe('claimLines', () => {
  it('builds Sauces-style claims from payload counts only', () => {
    expect(
      claimLines({
        separated_items: 38,
        items_total: 41,
        components_found: 3,
        items_with_ci: 0,
        distinct_raters: 1,
        products_with_battles: 7,
        products_ranked: 41,
        statistics_note: null,
      })
    ).toEqual([
      '38 of 41 items are unbound.',
      '3 disconnected fields.',
      'No intervals — 1 rater.',
    ])
  })

  it('skips beats when fields are null', () => {
    expect(
      claimLines({
        separated_items: null,
        items_total: null,
        components_found: 1,
        items_with_ci: null,
        distinct_raters: 0,
        products_with_battles: null,
        products_ranked: null,
        statistics_note: null,
      })
    ).toEqual(['1 connected field.'])
  })

  it('claimCaption joins lines into one quiet sentence', () => {
    expect(
      claimCaption({
        separated_items: 38,
        items_total: 41,
        components_found: 3,
        items_with_ci: 0,
        distinct_raters: 1,
        products_with_battles: 41,
        products_ranked: 41,
        statistics_note: null,
      })
    ).toBe('38 of 41 items are unbound · 3 disconnected fields · No intervals — 1 rater')
  })
})

describe('focalPairRows', () => {
  it('only keeps pairs where focal is A — never invents 1 − p', () => {
    const rows = focalPairRows(
      [
        {
          a_product_id: 9,
          a_name: 'Focal',
          b_product_id: 2,
          b_name: 'Opp',
          p_a_beats_b: 0.72,
          observed_a_wins: 3,
          observed_b_wins: 1,
          observed_n: 4,
          directly_compared: true,
        },
        {
          a_product_id: 2,
          a_name: 'Opp',
          b_product_id: 9,
          b_name: 'Focal',
          p_a_beats_b: 0.28,
          observed_a_wins: 1,
          observed_b_wins: 3,
          observed_n: 4,
          directly_compared: true,
        },
      ],
      9
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.p_focal_beats).toBe(0.72)
    expect(rows[0]?.opponent_id).toBe(2)
  })
})
