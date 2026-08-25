import { describe, expect, it } from 'vitest'
import {
  derivedParentDisplayName,
  friendlyOwnershipCorrectionError,
  pendingSuggestionLabel,
  type BrandOwnershipDerived,
  type OwnershipPendingCorrection,
} from '../brandHome/brandOwnershipPortal'

describe('derivedParentDisplayName', () => {
  const derived = (name: string | null): BrandOwnershipDerived =>
    name
      ? {
          has_parent: true,
          parent: { conglomerate_id: 3, display_name: name },
          ultimate: null,
        }
      : { has_parent: false, parent: null, ultimate: null }

  it('returns immediate parent only', () => {
    expect(derivedParentDisplayName(derived('Coca-Cola'), 'Odwalla, Inc.')).toBe('Coca-Cola')
  })

  it('omits when parent matches brand name', () => {
    expect(derivedParentDisplayName(derived('Odwalla'), 'Odwalla')).toBe(null)
  })

  it('omits when no parent', () => {
    expect(derivedParentDisplayName(derived(null), 'Odwalla')).toBe(null)
  })
})

describe('friendlyOwnershipCorrectionError', () => {
  it('maps known codes', () => {
    expect(friendlyOwnershipCorrectionError('correction_matches_current')).toMatch(/already the recorded/i)
    expect(friendlyOwnershipCorrectionError('not_authorized')).toMatch(/permission/i)
    expect(friendlyOwnershipCorrectionError('conglomerate_not_active')).toMatch(/isn’t selectable/i)
  })
})

describe('pendingSuggestionLabel', () => {
  it('labels independent and named parents', () => {
    const pending = (partial: Partial<OwnershipPendingCorrection>): OwnershipPendingCorrection => ({
      correction_id: '1',
      assertion_type: 'has_parent',
      asserted_conglomerate_id: 6,
      asserted_display_name: 'General Mills',
      current_conglomerate_id: 3,
      status: 'pending_human_review',
      submitted_at: null,
      user_notes: null,
      ...partial,
    })
    expect(pendingSuggestionLabel(pending({}))).toBe('General Mills')
    expect(
      pendingSuggestionLabel(
        pending({ assertion_type: 'independent', asserted_display_name: null })
      )
    ).toBe('Independent')
  })
})
