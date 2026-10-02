import { describe, expect, it } from 'vitest'
import {
  BRAND_QUESTION_STARTERS,
  brandQuestionAnswerSource,
  brandQuestionKind,
  brandQuestionTypeLabel,
  brandQuestionsToWire,
  emptyBrandQuestion,
  fieldAnswerOptionLabels,
  syncBrandQuestionFieldOptions,
  withBrandQuestionAnswerSource,
  withBrandQuestionKind,
  withBrandQuestionOptions,
} from '../singleTest'

describe('brand question builder', () => {
  it('defaults to pick one', () => {
    const q = emptyBrandQuestion()
    expect(brandQuestionKind(q)).toBe('pick_one')
    expect(brandQuestionTypeLabel(q)).toBe('Pick one')
    expect(brandQuestionAnswerSource(q)).toBe('custom')
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

  it('builds field answer labels from designs and resolved competitors', () => {
    expect(
      fieldAnswerOptionLabels({
        conceptArms: [{ display_name: 'Midnight' }, { display_name: '' }],
        products: [
          {
            product_id: 1,
            frozen_display_name: 'Half Baked',
            frozen_brand_name: "Ben & Jerry's",
          },
          {
            product_id: null,
            frozen_display_name: 'Unresolved',
            frozen_brand_name: 'Skip',
          },
        ],
      })
    ).toEqual(['Design A — Midnight', 'Design B', "Ben & Jerry's — Half Baked"])
  })

  it('stashes custom answers when switching to field and restores them', () => {
    const custom = {
      ...emptyBrandQuestion(),
      prompt: 'Which looks most premium?',
      options: ['Matte', 'Gloss'],
    }
    const field = ['Design A — Midnight', "Ben & Jerry's — Half Baked"]
    const asField = withBrandQuestionAnswerSource(custom, 'field', field)
    expect(brandQuestionAnswerSource(asField)).toBe('field')
    expect(asField.options).toEqual(field)
    expect(asField.customOptionsStash).toEqual(['Matte', 'Gloss'])

    const back = withBrandQuestionAnswerSource(asField, 'custom', field)
    expect(brandQuestionAnswerSource(back)).toBe('custom')
    expect(back.options).toEqual(['Matte', 'Gloss'])
    expect(back.customOptionsStash).toBeUndefined()
  })

  it('resyncs field-mode options when the field changes', () => {
    const q = withBrandQuestionAnswerSource(
      { ...emptyBrandQuestion(), options: ['Old A', 'Old B'] },
      'field',
      ['Old A', 'Old B']
    )
    const synced = syncBrandQuestionFieldOptions(q, ['Design A', 'Design B', 'Comp'])
    expect(synced.options).toEqual(['Design A', 'Design B', 'Comp'])
    expect(syncBrandQuestionFieldOptions(synced, synced.options)).toBe(synced)
  })
})
