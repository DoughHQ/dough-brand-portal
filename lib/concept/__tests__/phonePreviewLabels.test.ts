import { describe, expect, it } from 'vitest'
import {
  groupPhonePreviewScreens,
  phonePreviewOwnership,
  phonePreviewScreenLabel,
} from '../journey'

describe('phonePreviewScreenLabel', () => {
  it('matches journey-card vocabulary', () => {
    expect(phonePreviewScreenLabel('screener')).toBe('Screeners')
    expect(phonePreviewScreenLabel('rating')).toBe('First look')
    expect(phonePreviewScreenLabel('why_followups')).toBe('Why follow-up')
    expect(phonePreviewScreenLabel('maxdiff')).toBe('What matters')
    expect(phonePreviewScreenLabel('brand_question')).toBe('Your questions')
  })
})

describe('phonePreviewOwnership', () => {
  it('marks operator-owned steps', () => {
    expect(phonePreviewOwnership('battles')).toBe('Yours to write')
    expect(phonePreviewOwnership('rating')).toBe('Dough method')
  })
})

describe('groupPhonePreviewScreens', () => {
  it('collapses consecutive same-stage screens', () => {
    const groups = groupPhonePreviewScreens([
      { kind: 'screener' },
      { kind: 'screener' },
      { kind: 'rating' },
      { kind: 'battles' },
      { kind: 'why_followups' },
    ])
    expect(groups.map((g) => g.id)).toEqual(['screeners', 'first_look', 'battles'])
    expect(groups[0]!.screens).toHaveLength(2)
    expect(groups[2]!.screens).toHaveLength(2)
  })
})
