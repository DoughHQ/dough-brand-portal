import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import type { PhonePreviewJourney } from '@/lib/concept/journey'
import {
  fieldIssueLabel,
  initialJourneyOpen,
  journeyLengthLabel,
} from '../journeyLabels'

function preview(counts: PhonePreviewJourney['counts']): PhonePreviewJourney {
  return {
    counts,
    screens: [],
    field_issues: [],
    needs_review: false,
  }
}

describe('journey labels', () => {
  it('opens the first unfinished brand-owned step', () => {
    expect(initialJourneyOpen(createEmptyConceptDraft())).toBe('screeners')
  })

  it('formats equal and ranged journey lengths', () => {
    expect(journeyLengthLabel(null)).toBeNull()
    expect(
      journeyLengthLabel(preview({ total_min: 1, total_max: 1 })),
    ).toBe('1 screen · ~6 min')
    expect(
      journeyLengthLabel(preview({ total_min: 8, total_max: 11 })),
    ).toBe('8–11 screens · ~6 min')
  })

  it('keeps field-issue copy for the known codes', () => {
    expect(fieldIssueLabel('FIELD_TOO_SMALL')).toBe('Add more items to the field')
    expect(fieldIssueLabel('FIELD_TOO_LARGE')).toBe('Field is too large')
    expect(fieldIssueLabel('BENCHMARK_RETIRED')).toBe(
      'This study type no longer uses a benchmark',
    )
    expect(fieldIssueLabel('DESIGN_REQUIRED')).toBe('Add at least one design')
    expect(fieldIssueLabel('IMAGE_REQUIRED')).toBe(
      'Every design and competitor needs an image.',
    )
    expect(fieldIssueLabel('PRICE_UNSET')).toBe('Price Unset')
  })
})
