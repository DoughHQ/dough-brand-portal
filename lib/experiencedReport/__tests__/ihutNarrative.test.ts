import { describe, expect, it } from 'vitest'
import {
  deriveIhutNarrative,
  strongestAttributeDirection,
} from '../ihutNarrative'
import type { IhutCoreReport } from '../ihutCoreTypes'

function reportWith(
  overall: string,
  taste = 'cleared',
  liking = 'cleared',
  price = 'cleared',
): IhutCoreReport {
  const metric = (result: string) => ({
    share: 0.67,
    n: 30,
    yes: 20,
    lo: 0.49,
    hi: 0.81,
    bar: 0.6,
    result,
  })
  return {
    version: 'IHUT_CORE_V1',
    taste_only: false,
    success_bars: {
      taste_win_share: 0.6,
      liking_share: 0.6,
      buy_at_price_share: 0.6,
    },
    verdict: {
      ref: 1,
      name: 'Pesto',
      overall,
      taste_win: metric(taste),
      liking: metric(liking),
      buy_at_price: metric(price),
    },
    promise_vs_delivery: {
      shelf: [],
      taste: [],
      map: [],
      note: '',
    },
    liking: [],
    price_check: [],
    attribute_penalties: [],
    expectation_vs_experience: [],
    buy_order: [],
    taste_why: [],
    day2: {
      preference_hold: { n: 0, same_favorite_share: null },
      consumption: [],
      wear: [],
    },
  }
}

describe('deriveIhutNarrative', () => {
  it('leads with the server verdict and avoids sales overclaims', () => {
    const narrative = deriveIhutNarrative(reportWith('cleared'))
    expect(narrative?.headline).toBe('Pesto cleared every success bar you set.')
    expect(narrative?.implication).toContain('research evidence')
    expect(narrative?.implication.toLowerCase()).not.toContain('will sell')
  })

  it('identifies price as the constraint when experience clears', () => {
    const narrative = deriveIhutNarrative(
      reportWith('not_cleared', 'cleared', 'cleared', 'not_cleared'),
    )
    expect(narrative?.headline).toBe('Pesto did not clear buy at price.')
    expect(narrative?.implication).toContain('product experience cleared')
    expect(narrative?.implication).toContain('tested price did not')
  })

  it('never recomputes an overall server verdict from the metric calls', () => {
    const narrative = deriveIhutNarrative(reportWith('not_cleared'))
    expect(narrative?.headline).toBe('Pesto did not clear the success test.')
  })

  it('does not turn an attractive point estimate into a pass', () => {
    const narrative = deriveIhutNarrative(
      reportWith('too_close_to_call', 'too_close_to_call'),
    )
    expect(narrative?.headline).toContain('too close to call')
    expect(narrative?.metrics[0].claim).toContain('67%')
    expect(narrative?.implication).toContain('interval')
  })

  it('is transparent when no success bars were tested', () => {
    const narrative = deriveIhutNarrative(
      reportWith('not_tested', 'not_tested', 'not_tested', 'not_tested'),
    )
    expect(narrative?.tone).toBe('neutral')
    expect(narrative?.implication).toContain('Do not retroactively move a bar')
  })
})

describe('strongestAttributeDirection', () => {
  it('returns the largest directional issue for the hero only', () => {
    expect(
      strongestAttributeDirection(
        [
          {
            ref: 1,
            name: 'Pesto',
            attribute: 'salt',
            attribute_label: 'Salt level',
            n: 20,
            too_little_share: 0.1,
            just_right_share: 0.6,
            too_much_share: 0.3,
          },
          {
            ref: 2,
            name: 'Other',
            attribute: 'heat',
            attribute_label: 'Heat',
            n: 20,
            too_little_share: 0.8,
            just_right_share: 0.2,
            too_much_share: 0,
          },
        ],
        1,
      ),
    ).toMatchObject({
      label: 'Salt level',
      direction: 'too_much',
      share: 0.3,
    })
  })
})
