import { describe, expect, it } from 'vitest'
import { createEmptyBoxDraft } from '../defaults'
import {
  audienceSummaryChips,
  hasNarrowAudienceFilters,
} from '../audienceSummary'
import type { BoxStudyDraft } from '../types'

function draft(overrides: Partial<BoxStudyDraft> = {}): BoxStudyDraft {
  return {
    ...createEmptyBoxDraft(1),
    ...overrides,
    eligibility: {
      ...createEmptyBoxDraft(1).eligibility,
      ...overrides.eligibility,
    },
  }
}

describe('hasNarrowAudienceFilters', () => {
  it('is false for an open audience besides experience', () => {
    expect(hasNarrowAudienceFilters(draft({ eligibilityTier: 'tried' }))).toBe(
      false
    )
  })

  it('is true when a demographic or dietary rule is set', () => {
    expect(
      hasNarrowAudienceFilters(
        draft({
          eligibility: {
            ...createEmptyBoxDraft(1).eligibility,
            targetStates: ['CA'],
          },
        })
      )
    ).toBe(true)
  })
})

describe('audienceSummaryChips', () => {
  it('omits Anyone and empty rules', () => {
    expect(audienceSummaryChips(draft())).toEqual([])
  })

  it('lists active filters in order', () => {
    expect(
      audienceSummaryChips(
        draft({
          eligibilityTier: 'tried',
          eligibility: {
            ...createEmptyBoxDraft(1).eligibility,
            targetStates: ['CA', 'NY'],
            requiredDietaryFlags: ['no_dairy'],
            minAge: 21,
            minCategoryLevel: 3,
            qualifyingTaxonomyNodeId: 10,
            qualifyingNodeLabel: 'Ice Cream',
            minCategoryBattles: 6,
          },
        }),
        { dietaryLabels: { no_dairy: 'Dairy-Free' } }
      )
    ).toEqual([
      'Has tried this product',
      'California, New York',
      'Dairy-Free',
      'Age 21+',
      'Ice Cream · L3 · 6 battles',
    ])
  })
})
