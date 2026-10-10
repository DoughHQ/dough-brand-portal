// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RightsSheet, { type RightsLocalRow } from '../../RightsSheet'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'

function enumField(
  code: string,
  allowedValues: string[] = ['standard_a', 'standard_b']
): ProofSubMetricRow {
  return {
    sub_metric_code: code,
    label: code,
    definition: 'test',
    value_kind: 'enum',
    allowed_values: allowedValues,
    unit_source: 'fixed',
    unit: null,
    allowed_units: null,
    requires_method: false,
    allowed_methods: null,
    requires_boundary: false,
    allowed_boundaries: null,
    requires_data_quality: false,
    allowed_data_qualities: null,
    subject_kind_default: 'whole_product',
    metric_code: 'rights',
    sort_order: 1,
  }
}

function numericField(code: string): ProofSubMetricRow {
  return {
    ...enumField(code, []),
    value_kind: 'numeric',
    allowed_values: null,
    unit_source: 'fixed',
    unit: 'percent',
    allowed_units: ['percent'],
  }
}

function localRow(
  field: ProofSubMetricRow,
  key: string,
  patch: Partial<DisclosureDraft>
): RightsLocalRow {
  return {
    key,
    draft: blankDraft(field, { status: 'disclosed', ...patch }),
    saved: null,
  }
}

afterEach(cleanup)

describe('RightsSheet bundled editors', () => {
  it('applies provenance and publish transitions to every active labor row', async () => {
    const user = userEvent.setup()
    const laborField = enumField('labor_standard_alignment')
    const scopeField = enumField('labor_policy_scope')
    const laborRow = localRow(laborField, 'labor-row', { valueText: 'standard_a' })
    const scopeRow = localRow(scopeField, 'scope-row', { valueText: 'standard_b' })
    const onChange = vi.fn()

    render(
      <RightsSheet
        fieldsByCode={{
          labor_standard_alignment: laborField,
          labor_policy_scope: scopeField,
        }}
        rowsByCode={{
          labor_standard_alignment: [laborRow],
          labor_policy_scope: [scopeRow],
        }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        onChange={onChange}
        onSaveRow={vi.fn()}
        onSaveBundle={vi.fn()}
      />
    )

    await user.click(screen.getByRole('radio', { name: /Brand document/i }))

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenCalledWith(
      'labor_standard_alignment',
      'labor-row',
      expect.objectContaining({
        sourceTier: 'brand_document',
        status: 'disclosed',
      })
    )
    expect(onChange).toHaveBeenCalledWith(
      'labor_policy_scope',
      'scope-row',
      expect.objectContaining({
        sourceTier: 'brand_document',
        status: 'disclosed',
      })
    )

    onChange.mockClear()
    await user.click(screen.getByRole('checkbox', { name: /Show to shoppers/i }))
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenCalledWith(
      'labor_standard_alignment',
      'labor-row',
      expect.objectContaining({ published: true })
    )
    expect(onChange).toHaveBeenCalledWith(
      'labor_policy_scope',
      'scope-row',
      expect.objectContaining({ published: true })
    )
  })

  it('normalizes supplier coverage as a percentage disclosure', () => {
    const depthField = enumField('supplier_disclosure_depth')
    const coverageField = numericField('supplier_disclosure_coverage_pct')
    const depthRow = localRow(depthField, 'depth-row', { valueText: 'standard_a' })
    const coverageRow = localRow(coverageField, 'coverage-row', { valueNum: null })
    const onChange = vi.fn()

    render(
      <RightsSheet
        fieldsByCode={{
          supplier_disclosure_depth: depthField,
          supplier_disclosure_coverage_pct: coverageField,
        }}
        rowsByCode={{
          supplier_disclosure_depth: [depthRow],
          supplier_disclosure_coverage_pct: [coverageRow],
        }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        onChange={onChange}
        onSaveRow={vi.fn()}
        onSaveBundle={vi.fn()}
      />
    )

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '80' } })

    expect(onChange).toHaveBeenCalledWith(
      'supplier_disclosure_coverage_pct',
      'coverage-row',
      expect.objectContaining({
        status: 'disclosed',
        valueNum: 80,
        valueUnit: 'percent',
      })
    )
  })
})

describe('RightsSheet single-row editors', () => {
  it('clears incompatible provenance, publishes, and saves through user controls', async () => {
    const user = userEvent.setup()
    const certField = enumField('social_certification')
    const certRow = localRow(certField, 'cert-row', {
      valueText: 'standard_a',
      sourceTier: 'third_party_verified',
      sourceUrl: 'https://example.com/certificate',
      issuerName: 'Verifier',
      credentialId: 'CERT-1',
    })
    const onChange = vi.fn()
    const onSaveRow = vi.fn()

    render(
      <RightsSheet
        fieldsByCode={{ social_certification: certField }}
        rowsByCode={{ social_certification: [certRow] }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        onChange={onChange}
        onSaveRow={onSaveRow}
        onSaveBundle={vi.fn()}
      />
    )

    await user.click(screen.getByRole('radio', { name: /Brand stated/i }))
    expect(onChange).toHaveBeenCalledWith(
      'social_certification',
      'cert-row',
      expect.objectContaining({
        sourceTier: 'brand_stated',
        sourceUrl: null,
        issuerName: null,
        credentialId: null,
      })
    )

    await user.click(screen.getByRole('checkbox', { name: /Show to shoppers/i }))
    expect(onChange).toHaveBeenCalledWith(
      'social_certification',
      'cert-row',
      expect.objectContaining({ published: true })
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSaveRow).toHaveBeenCalledWith(certField, certRow)
  })

  it('keeps every mutation control disabled for read-only users', () => {
    const certField = enumField('social_certification')
    const certRow = localRow(certField, 'cert-row', {
      valueText: 'standard_a',
      sourceTier: 'third_party_verified',
    })

    render(
      <RightsSheet
        fieldsByCode={{ social_certification: certField }}
        rowsByCode={{ social_certification: [certRow] }}
        canEdit={false}
        savingKey={null}
        storyError={null}
        errors={{}}
        onChange={vi.fn()}
        onSaveRow={vi.fn()}
        onSaveBundle={vi.fn()}
      />
    )

    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true)
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true)
    expect(
      screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)
    ).toBe(true)
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })
})
