import { describe, expect, it } from 'vitest'
import type { ProofSubMetricRow } from '../disclosures'
import { subjectDisclosureDraft } from '../subjectDisclosureDraft'

const field: ProofSubMetricRow = {
  sub_metric_code: 'refinement_state',
  label: 'Refinement state',
  definition: 'test',
  value_kind: 'enum',
  allowed_values: ['refined', 'unrefined'],
  unit_source: 'fixed',
  unit: null,
  allowed_units: null,
  requires_method: false,
  allowed_methods: null,
  requires_boundary: false,
  allowed_boundaries: null,
  requires_data_quality: false,
  allowed_data_qualities: null,
  subject_kind_default: 'ingredient',
  metric_code: 'operations',
  sort_order: 1,
}

describe('subjectDisclosureDraft', () => {
  it('creates a started ingredient disclosure from an editor change', () => {
    expect(
      subjectDisclosureDraft({
        field,
        subject: 'Olive oil',
        patch: { valueText: 'unrefined' },
      })
    ).toMatchObject({
      subjectKind: 'ingredient',
      subjectLabel: 'Olive oil',
      status: 'disclosed',
      valueText: 'unrefined',
    })
  })

  it('preserves saved metadata while applying a later editor transition', () => {
    const current = subjectDisclosureDraft({
      field,
      subject: 'Olive oil',
      patch: {
        valueText: 'unrefined',
        sourceTier: 'third_party_verified',
        sourceUrl: 'https://example.com/certificate',
      },
    })

    const next = subjectDisclosureDraft({
      field,
      subject: 'Olive oil',
      current,
      patch: { published: true },
    })

    expect(next).toMatchObject({
      valueText: 'unrefined',
      sourceTier: 'third_party_verified',
      sourceUrl: 'https://example.com/certificate',
      published: true,
    })
  })

  it('reasserts the editor subject and disclosed state over stale data', () => {
    const current = subjectDisclosureDraft({
      field,
      subject: 'Old subject',
      patch: { status: 'not_disclosed' },
    })

    expect(
      subjectDisclosureDraft({
        field,
        subject: 'Cocoa butter',
        current,
        patch: { valueText: 'refined' },
      })
    ).toMatchObject({
      subjectKind: 'ingredient',
      subjectLabel: 'Cocoa butter',
      status: 'disclosed',
      valueText: 'refined',
    })
  })
})
