// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  blankDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import DisclosureRowEditor from '../DisclosureRowEditor'

const field: ProofSubMetricRow = {
  sub_metric_code: 'test_disclosure',
  label: 'Test disclosure',
  definition: 'A test definition.',
  value_kind: 'enum',
  allowed_values: ['option_a', 'other'],
  unit_source: 'fixed',
  unit: null,
  allowed_units: null,
  requires_method: true,
  allowed_methods: ['method_a'],
  requires_boundary: true,
  allowed_boundaries: ['boundary_a'],
  requires_data_quality: true,
  allowed_data_qualities: ['quality_a'],
  subject_kind_default: 'ingredient',
  metric_code: 'test',
  sort_order: 1,
}

afterEach(cleanup)

describe('DisclosureRowEditor', () => {
  it('clears disclosure values when status becomes non-disclosed', () => {
    const onChange = vi.fn()
    const draft = blankDraft(field, {
      subjectLabel: 'Cocoa',
      valueText: 'other',
      valueNum: 4,
      valueBool: true,
      valueDate: '2026-01-01',
      valueUnit: 'kg',
      methodCode: 'method_a',
      boundaryCode: 'boundary_a',
      dataQuality: 'quality_a',
      otherText: 'Custom',
    })

    render(
      <DisclosureRowEditor
        field={field}
        draft={draft}
        canEdit
        saving={false}
        error={null}
        onChange={onChange}
        onSave={vi.fn()}
      />,
    )

    fireEvent.change(screen.getAllByRole('combobox')[0]!, {
      target: { value: 'not_disclosed' },
    })

    expect(onChange).toHaveBeenCalledWith({
      ...draft,
      status: 'not_disclosed',
      valueText: null,
      valueNum: null,
      valueBool: null,
      valueDate: null,
      valueUnit: null,
      methodCode: null,
      boundaryCode: null,
      dataQuality: null,
      otherText: null,
    })
  })

  it('emits provenance and publish changes and invokes save', () => {
    const onChange = vi.fn()
    const onSave = vi.fn()
    const draft = blankDraft(field, {
      disclosureId: 42,
      subjectLabel: 'Cocoa',
      valueText: 'option_a',
      sourceTier: 'third_party_verified',
      sourceUrl: 'https://example.com/certificate',
      issuerName: 'Verifier',
      credentialId: 'CERT-1',
    })

    render(
      <DisclosureRowEditor
        field={field}
        draft={draft}
        canEdit
        saving={false}
        error={null}
        onChange={onChange}
        onSave={onSave}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /Brand document/i }))
    expect(onChange).toHaveBeenCalledWith({
      ...draft,
      sourceTier: 'brand_document',
      sourceUrl: draft.sourceUrl,
      issuerName: null,
      credentialId: null,
    })

    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith({ ...draft, published: true })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('disables every control and hides save when read-only', () => {
    const { container } = render(
      <DisclosureRowEditor
        field={field}
        draft={blankDraft(field, {
          subjectLabel: 'Cocoa',
          valueText: 'option_a',
        })}
        canEdit={false}
        saving={false}
        error={null}
        onChange={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    const controls = container.querySelectorAll('input, select, textarea')
    expect(controls.length).toBeGreaterThan(0)
    for (const control of controls) {
      expect((control as HTMLInputElement).disabled).toBe(true)
    }
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })
})
