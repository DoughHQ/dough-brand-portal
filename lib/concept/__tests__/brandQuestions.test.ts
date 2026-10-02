import { describe, expect, it } from 'vitest'
import {
  BRAND_QUESTION_STARTERS,
  brandQuestionKind,
  brandQuestionTypeLabel,
  brandQuestionsToWire,
  emptyBrandQuestion,
  withBrandQuestionKind,
  withBrandQuestionOptions,
} from '../singleTest'

describe('brand question builder', () => {
  it('defaults to pick one', () => {
    const q = emptyBrandQuestion()
    expect(brandQuestionKind(q)).toBe('pick_one')
    expect(brandQuestionTypeLabel(q)).toBe('Pick one')
  })

  it('pick several wires max_select as the filled answer count', () => {
    const q = withBrandQuestionKind(
      {
        ...emptyBrandQuestion(),
        prompt: 'Which looks most premium?',
        options: ['A', 'B', 'C', ''],
      },
      'pick_several'
    )
    expect(brandQuestionKind(q)).toBe('pick_several')
    expect(brandQuestionTypeLabel(q)).toBe('Pick several')
    expect(brandQuestionsToWire([q])).toEqual([
      {
        prompt: 'Which looks most premium?',
        options: ['A', 'B', 'C'],
        max_select: 3,
      },
    ])
  })

  it('pick one omits max_select on the wire', () => {
    const q = {
      ...emptyBrandQuestion(),
      prompt: 'Which would you buy?',
      options: ['Vanilla', 'Chocolate'],
      max_select: 1,
    }
    expect(brandQuestionsToWire([q])).toEqual([
      {
        prompt: 'Which would you buy?',
        options: ['Vanilla', 'Chocolate'],
      },
    ])
  })

  it('keeps pick-several max_select aligned when answers change', () => {
    const base = withBrandQuestionKind(emptyBrandQuestion(), 'pick_several')
    const grown = withBrandQuestionOptions(base, ['One', 'Two', 'Three'])
    expect(grown.max_select).toBe(3)
    const shrunk = withBrandQuestionOptions(grown, ['One', 'Two'])
    expect(shrunk.max_select).toBe(2)
  })

  it('starters only name packaging prompts, never invent answers', () => {
    expect(BRAND_QUESTION_STARTERS).toEqual([
      'Which looks most premium?',
      'Which would you buy?',
      'Which feels most like your brand?',
    ])
    for (const starter of BRAND_QUESTION_STARTERS) {
      expect(starter.length).toBeGreaterThanOrEqual(8)
      expect(starter.length).toBeLessThanOrEqual(140)
    }
  })
})
