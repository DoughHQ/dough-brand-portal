import { describe, expect, it } from 'vitest'
import {
  changeSummary,
  friendlyOwnershipReviewError,
  liveParentLabel,
  safeEvidenceHref,
  type PendingOwnershipCorrection,
} from '../ownershipCorrections'

function row(partial: Partial<PendingOwnershipCorrection>): PendingOwnershipCorrection {
  return {
    correction_id: 'c1',
    brand_id: 1,
    brand_name: 'Odwalla, Inc.',
    assertion_type: 'has_parent',
    asserted_conglomerate_id: 6,
    asserted_display_name: 'General Mills',
    current_conglomerate_id: 3,
    current_display_name: 'Coca-Cola',
    snapshot_is_stale: false,
    live_conglomerate_id: 3,
    user_notes: null,
    evidence_url: null,
    submitted_by_portal_user_id: null,
    submitted_at: null,
    ...partial,
  }
}

describe('changeSummary', () => {
  it('phrases has_parent and independent', () => {
    expect(changeSummary(row({}))).toBe('Change parent: Coca-Cola → General Mills')
    expect(
      changeSummary(
        row({
          assertion_type: 'independent',
          asserted_conglomerate_id: null,
          asserted_display_name: null,
          current_display_name: null,
        })
      )
    ).toBe('Change parent: None → Independent (no parent)')
  })
})

describe('safeEvidenceHref', () => {
  it('accepts http(s) and rejects junk', () => {
    expect(safeEvidenceHref('https://example.com/a')).toBe('https://example.com/a')
    expect(safeEvidenceHref('not a url')).toBe(null)
    expect(safeEvidenceHref('javascript:alert(1)')).toBe(null)
  })
})

describe('liveParentLabel', () => {
  it('resolves from row or lookup map', () => {
    expect(liveParentLabel(row({}))).toBe('Coca-Cola')
    expect(
      liveParentLabel(
        row({ live_conglomerate_id: 99, current_conglomerate_id: 3 }),
        new Map([[99, 'PepsiCo']])
      )
    ).toBe('PepsiCo')
    expect(liveParentLabel(row({ live_conglomerate_id: null }))).toBe('None')
  })
})

describe('friendlyOwnershipReviewError', () => {
  it('maps known codes', () => {
    expect(friendlyOwnershipReviewError('stale_snapshot')).toMatch(/changed since submission/i)
    expect(friendlyOwnershipReviewError('asserted_conglomerate_not_active')).toMatch(/no longer active/i)
    expect(friendlyOwnershipReviewError('cannot_review_superseded')).toMatch(/replaced/i)
  })
})
