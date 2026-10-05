import { describe, expect, it } from 'vitest'
import {
  IHUT_BUY_ORDER_PROMPT,
  IHUT_DAY1_JOURNEY,
  IHUT_DAY2_JOURNEY,
  IHUT_DEFAULT_ATTRIBUTES,
  IHUT_SHELF_BATTLE_PROMPT,
  IHUT_TASTE_BATTLE_PROMPT,
  attributeLabels,
  brandQuestionsWire,
  emptyIhutBrandQuestion,
  ihutBattlePairCount,
  sanitizeIhutAttributes,
  sanitizeIhutSuccessBars,
  successBarsWire,
} from '../method'

describe('IHUT method pack (portal mirror)', () => {
  it('locks the two battle prompts and buy-order copy', () => {
    expect(IHUT_SHELF_BATTLE_PROMPT).toBe('Which would you pick up?')
    expect(IHUT_TASTE_BATTLE_PROMPT).toBe('Which did you enjoy more?')
    expect(IHUT_BUY_ORDER_PROMPT).toBe("Put them in the order you'd buy them")
  })

  it('names the shelf track Battles (not Shelf battles) for concept chrome parity', () => {
    expect(IHUT_DAY1_JOURNEY.find((s) => s.id === 'shelf_battles')?.title).toBe(
      'Battles'
    )
    expect(IHUT_DAY1_JOURNEY.find((s) => s.id === 'taste_battles')?.title).toBe(
      'Taste battles'
    )
  })

  it('counts pairwise matchups like the engines', () => {
    expect(ihutBattlePairCount(1)).toBe(0)
    expect(ihutBattlePairCount(2)).toBe(1)
    expect(ihutBattlePairCount(3)).toBe(3)
    expect(ihutBattlePairCount(4)).toBe(6)
    expect(ihutBattlePairCount(5)).toBe(6)
  })

  it('exposes Day 1 + Day 2 journey rows with exactly three brand-editable seats', () => {
    expect(IHUT_DAY1_JOURNEY.map((s) => s.id)).toEqual([
      'shelf_battles',
      'expectation',
      'try_each',
      'taste_battles',
      'buy_order',
      'price_check',
      'best_worst',
      'brand_questions',
      'success_bars',
    ])
    expect(IHUT_DAY1_JOURNEY.filter((s) => s.editable).map((s) => s.editable)).toEqual([
      'attributes',
      'brand_questions',
      'success_bars',
    ])
    expect(IHUT_DAY2_JOURNEY.every((s) => s.day2)).toBe(true)
  })

  it('sanitizes attributes to ≤3 allowed codes with Dough defaults', () => {
    expect(sanitizeIhutAttributes(null)).toEqual(IHUT_DEFAULT_ATTRIBUTES)
    expect(sanitizeIhutAttributes(['sweetness', 'texture', 'bogus', 'saltiness', 'flavor_strength'])).toEqual([
      'sweetness',
      'texture',
      'saltiness',
    ])
    expect(attributeLabels(['sweetness', 'texture'])).toBe('Sweetness · Texture')
  })

  it('clamps success bars and wires snake_case for publish', () => {
    expect(sanitizeIhutSuccessBars({ tasteWinShare: 2, likingShare: 0.01 })).toEqual({
      tasteWinShare: 0.95,
      likingShare: 0.1,
      buyAtPriceShare: 0.5,
    })
    expect(successBarsWire(sanitizeIhutSuccessBars({}))).toEqual({
      taste_win_share: 0.5,
      liking_share: 0.5,
      buy_at_price_share: 0.5,
    })
  })

  it('publishes only valid brand questions (prompt ≥8, ≥2 options, max 2)', () => {
    const good = emptyIhutBrandQuestion()
    good.prompt = 'Would you recommend this?'
    good.options = ['Yes', 'No', '']
    const short = emptyIhutBrandQuestion()
    short.prompt = 'Nope?'
    short.options = ['A', 'B']
    expect(brandQuestionsWire([good, short, emptyIhutBrandQuestion()])).toEqual([
      { prompt: 'Would you recommend this?', options: ['Yes', 'No'], max_select: 1 },
    ])
  })
})
