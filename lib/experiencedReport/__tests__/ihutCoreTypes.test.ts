import { describe, expect, it } from 'vitest'
import {
  hasIhutVerdict,
  isIhutCoreReport,
  type IhutCoreReport,
} from '../ihutCoreTypes'

describe('IHUT_CORE_V1 report contract', () => {
  it('accepts the full report shape', () => {
    const sample: IhutCoreReport = {
      version: 'IHUT_CORE_V1',
      taste_only: false,
      success_bars: {
        taste_win_share: 0.5,
        liking_share: 0.5,
        buy_at_price_share: 0.5,
      },
      promise_vs_delivery: {
        shelf: [{ ref: 1, name: 'Yours', is_yours: true, strength: 0.6, rank: 1 }],
        taste: [{ ref: 1, name: 'Yours', is_yours: true, strength: 0.4, rank: 2 }],
        map: [
          {
            ref: 1,
            name: 'Yours',
            is_yours: true,
            shelf_strength: 0.6,
            taste_strength: 0.4,
          },
        ],
        note: 'Pack strength (shelf) vs taste strength on one Bradley-Terry scale per track.',
      },
      liking: [{ ref: 1, name: 'Yours', n: 40, top_two_share: 0.62, lo: 0.47, hi: 0.75 }],
      price_check: [{ ref: 1, name: 'Yours', n: 40, yes_share: 0.55, lo: 0.4, hi: 0.69 }],
      attribute_penalties: [
        {
          ref: 1,
          name: 'Yours',
          attribute: 'sweetness',
          attribute_label: 'Sweetness',
          n: 40,
          too_little_share: 0.1,
          just_right_share: 0.7,
          too_much_share: 0.2,
        },
      ],
      expectation_vs_experience: [
        {
          ref: 1,
          name: 'Yours',
          n: 40,
          liked_and_expected_good_share: 0.4,
          liked_share: 0.62,
        },
      ],
      buy_order: [{ ref: 1, name: 'Yours', n: 40, first_share: 0.45, avg_rank: 1.8 }],
      taste_why: [{ answer: 'Flavor', n: 12 }],
      day2: {
        preference_hold: { n: 30, same_favorite_share: 0.7 },
        consumption: [{ answer: 'About half', n: 14 }],
        wear: [{ answer: 'Grown on me', n: 18 }],
      },
      verdict: {
        ref: 1,
        name: 'Yours',
        taste_win: { bar: 0.5, n: 80, wins: 48, share: 0.6, lo: 0.49, hi: 0.7, result: 'cleared' },
        liking: { bar: 0.5, n: 40, share: 0.62, lo: 0.47, hi: 0.75, result: 'cleared' },
        buy_at_price: {
          bar: 0.5,
          n: 40,
          share: 0.55,
          lo: 0.4,
          hi: 0.69,
          result: 'too_close_to_call',
        },
        overall: 'too_close_to_call',
      },
    }
    expect(isIhutCoreReport(sample)).toBe(true)
    expect(hasIhutVerdict(sample.verdict)).toBe(true)
    expect(isIhutCoreReport({ version: 'legacy' })).toBe(false)
    expect(hasIhutVerdict({})).toBe(false)
  })
})
