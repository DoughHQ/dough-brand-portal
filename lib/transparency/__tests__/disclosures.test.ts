import { describe, expect, it } from 'vitest'
import { formatProofCode, formatUnitSuffix } from '@/lib/transparency/displayMap'
import {
  blankDraft,
  clientValidate,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'

const carbonField: ProofSubMetricRow = {
  sub_metric_code: 'product_carbon_footprint',
  label: 'Product carbon footprint',
  definition: 'test',
  value_kind: 'numeric',
  allowed_values: null,
  unit_source: 'row',
  unit: null,
  allowed_units: ['kgCO2e_per_kg'],
  requires_method: true,
  allowed_methods: ['ISO_14067'],
  requires_boundary: true,
  allowed_boundaries: ['cradle_to_gate'],
  requires_data_quality: true,
  allowed_data_qualities: ['primary_data'],
  subject_kind_default: 'whole_product',
  metric_code: 'product_footprint',
  sort_order: 160,
}

describe('formatProofCode', () => {
  it('keeps standards capitalisation', () => {
    expect(formatProofCode('ISO_14067')).toBe('ISO 14067')
    expect(formatProofCode('RSPO')).toBe('RSPO')
    expect(formatProofCode('SA8000')).toBe('SA8000')
    expect(formatProofCode('GAP_step_4')).toBe('GAP step 4')
    expect(formatProofCode('hpp')).toBe('HPP')
    expect(formatProofCode('uht')).toBe('UHT')
    expect(formatProofCode('cradle_to_gate')).toBe('Cradle-to-gate')
    expect(formatProofCode('kgCO2e_per_kg')).toBe('kgCO₂e per kg')
  })

  it('formats units', () => {
    expect(formatUnitSuffix('percent')).toBe('%')
    expect(formatUnitSuffix('kgCO2e_per_serving')).toBe('kgCO₂e per serving')
  })
})

describe('clientValidate', () => {
  it('rejects carbon without qualifiers', () => {
    const draft = blankDraft(carbonField, {
      valueNum: 1.42,
      valueUnit: 'kgCO2e_per_kg',
    })
    expect(clientValidate(carbonField, draft)).toMatch(/method/i)
  })

  it('rejects other without other_text', () => {
    const field: ProofSubMetricRow = {
      ...carbonField,
      sub_metric_code: 'packaging_disposal_route',
      label: 'Disposal route',
      value_kind: 'enum',
      unit_source: 'fixed',
      requires_method: false,
      requires_boundary: false,
      requires_data_quality: false,
      allowed_values: ['other', 'landfill'],
      allowed_units: null,
      allowed_methods: null,
      allowed_boundaries: null,
      allowed_data_qualities: null,
      subject_kind_default: 'component',
    }
    const draft = blankDraft(field, {
      subjectLabel: 'bottle',
      valueText: 'other',
      otherText: null,
    })
    expect(clientValidate(field, draft)).toMatch(/other/i)
  })

  it('allows not_disclosed without a value', () => {
    const draft = blankDraft(carbonField, {
      status: 'not_disclosed',
      valueNum: null,
      valueUnit: null,
    })
    expect(clientValidate(carbonField, draft)).toBeNull()
  })
})
