import { describe, expect, it } from 'vitest'
import {
  CORRECTION_FIELD,
  IDENTITY_LABELS,
  catalogCorrectionHref,
  correctionTypeSet,
  partitionOpenCorrections,
  pendingFieldSet,
  proposalByFieldMap,
  proposalHeadline,
  systemFlagTitle,
} from '../pendingCorrections'
import type { OpenCorrection } from '../types'

function correction(partial: Partial<OpenCorrection> & Pick<OpenCorrection, 'id'>): OpenCorrection {
  return {
    correction_type: 'name',
    status: 'pending',
    created_at: '2026-01-01T00:00:00.000Z',
    kind: 'proposal',
    review_reason: null,
    system_note: null,
    summary: '',
    current_category_name: null,
    proposed_category_name: null,
    other_category_description: null,
    user_notes: null,
    has_evidence_image: false,
    evidence_image_url: null,
    ...partial,
  }
}

describe('IDENTITY_LABELS / CORRECTION_FIELD', () => {
  it('maps known identity and correction keys', () => {
    expect(IDENTITY_LABELS.product_name_short).toBe('Short name')
    expect(CORRECTION_FIELD.nutrition_facts).toBe('nutrition')
    expect(CORRECTION_FIELD.product_image).toBe('images')
  })
})

describe('catalogCorrectionHref', () => {
  it('routes brand users and admins to their own correction desks', () => {
    expect(catalogCorrectionHref(false, null)).toBe('/corrections')
    expect(catalogCorrectionHref(false, 'case 1')).toBe('/corrections?focus=case+1')
    expect(catalogCorrectionHref(true, null)).toBe('/admin/corrections')
    expect(catalogCorrectionHref(true, 'case 1')).toBe('/admin/corrections?focus=case+1')
  })
})

describe('systemFlagTitle / proposalHeadline', () => {
  it('titles classifier reasons', () => {
    expect(
      systemFlagTitle(correction({ id: '1', kind: 'system_flag', review_reason: 'no_match_auto_classify' }))
    ).toBe("We're classifying this product")
    expect(
      systemFlagTitle(
        correction({ id: '2', kind: 'system_flag', review_reason: 'low_confidence_auto_classify' })
      )
    ).toBe("We're double-checking the category")
    expect(systemFlagTitle(correction({ id: '3', kind: 'system_flag', review_reason: null }))).toBe(
      'Dough is reviewing this product'
    )
  })

  it('prefers summary, else builds from correction type', () => {
    expect(proposalHeadline(correction({ id: '1', summary: 'Name tweak' }))).toBe('Name tweak')
    expect(proposalHeadline(correction({ id: '2', correction_type: 'price', summary: '' }))).toBe(
      'A price change is pending review'
    )
  })
})

describe('partition and pending sets', () => {
  const open = [
    correction({ id: 's1', kind: 'system_flag', correction_type: 'category' }),
    correction({ id: 'p1', kind: 'proposal', correction_type: 'nutrition_facts' }),
    correction({ id: 'p2', kind: 'proposal', correction_type: 'name' }),
  ]

  it('splits system flags from proposals', () => {
    const { systemFlags, proposals } = partitionOpenCorrections(open)
    expect(systemFlags.map((c) => c.id)).toEqual(['s1'])
    expect(proposals.map((c) => c.id)).toEqual(['p1', 'p2'])
  })

  it('lights category for system flags and mapped proposal fields', () => {
    expect([...pendingFieldSet(open)].sort()).toEqual(['category', 'name', 'nutrition'])
    expect([...correctionTypeSet(partitionOpenCorrections(open).proposals)].sort()).toEqual([
      'name',
      'nutrition',
    ])
  })

  it('keeps the first proposal per field', () => {
    const map = proposalByFieldMap(partitionOpenCorrections(open).proposals)
    expect(map.get('nutrition')?.id).toBe('p1')
    expect(map.get('name')?.id).toBe('p2')
  })
})
