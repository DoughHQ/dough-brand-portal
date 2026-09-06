import { describe, expect, it } from 'vitest'
import { blankDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'
import {
  chapterForMetric,
  rowPresence,
  summarizeInventoryRow,
} from '@/lib/transparency/proofChapters'

const originField: ProofSubMetricRow = {
  sub_metric_code: 'origin_country',
  label: 'Country of origin',
  definition: 'test',
  value_kind: 'enum',
  allowed_values: ['ISO_3166_1_alpha_2'],
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
  metric_code: 'origin',
  sort_order: 290,
}

describe('proofChapters', () => {
  it('maps metrics into P.R.O.O.F.', () => {
    expect(chapterForMetric('packaging')).toBe('planet')
    expect(chapterForMetric('animal_welfare')).toBe('rights')
    expect(chapterForMetric('origin')).toBe('origin')
    expect(chapterForMetric('process')).toBe('operations')
    expect(chapterForMetric('ingredients')).toBe('formula')
  })

  it('summarizes subject-aware origin rows', () => {
    const draft = blankDraft(originField, {
      disclosureId: 1,
      subjectLabel: 'coffee',
      valueText: 'CL',
      published: true,
      sourceTier: 'brand_stated',
      asofDate: '2026-01-15',
    })
    expect(rowPresence(draft)).toBe('published')
    const s = summarizeInventoryRow(originField, draft)
    expect(s.title).toBe('Coffee — Chile')
    expect(s.presenceLabel).toBe('Shown to shoppers')
  })
})
