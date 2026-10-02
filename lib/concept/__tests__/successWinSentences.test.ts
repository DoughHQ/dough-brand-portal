import { describe, expect, it } from 'vitest'
import {
  headToHeadWinSentence,
  likingWinSentence,
  priceWinSentence,
} from '../singleTest'

describe('success win sentences', () => {
  it('names the head-to-head share in plain language', () => {
    expect(headToHeadWinSentence({ kind: 'default' })).toBe(
      'You win the field when you take at least 50% of head-to-heads.'
    )
    expect(headToHeadWinSentence({ kind: 'custom', value: 0.33 })).toBe(
      'You win the field when you take at least 33% of head-to-heads.'
    )
    expect(headToHeadWinSentence({ kind: 'off' })).toBe(
      'Head-to-head is off for the verdict.'
    )
  })

  it('ties the price bar to the anchor when one exists', () => {
    expect(priceWinSentence({ kind: 'custom', value: 0.33 }, '$7.99')).toBe(
      'You win on price when at least 33% say they would pay $7.99 or more.'
    )
    expect(priceWinSentence({ kind: 'default' }, null)).toBe(
      'You win on price when at least 50% say they would pay your price or more.'
    )
    expect(priceWinSentence({ kind: 'off' }, '$7.99')).toBe(
      'Price is off for the verdict.'
    )
  })

  it('explains liking without jargon', () => {
    expect(likingWinSentence({ kind: 'default' })).toBe('Liking is off for the verdict.')
    expect(likingWinSentence({ kind: 'custom', value: 'absolute' })).toBe(
      'You win on liking when enough shoppers put it in the top two on first look.'
    )
    expect(likingWinSentence({ kind: 'off' })).toBe('Liking is off for the verdict.')
  })
})
