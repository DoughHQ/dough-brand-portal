// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import MadeKeptEditor from '../MadeKeptEditor'
import type { OpsLocalRow } from '../types'

function field(
  code: string,
  allowedValues: string[] | null = null,
): ProofSubMetricRow {
  return {
    sub_metric_code: code,
    label: code,
    definition: '',
    value_kind: allowedValues ? 'enum' : 'text',
    allowed_values: allowedValues,
    unit_source: 'none',
    unit: null,
    allowed_units: null,
    requires_method: false,
    allowed_methods: null,
    requires_boundary: false,
    allowed_boundaries: null,
    requires_data_quality: false,
    allowed_data_qualities: null,
    subject_kind_default: 'whole_product',
    metric_code: 'operations',
    sort_order: 0,
  }
}

function row(
  source: ProofSubMetricRow,
  key: string,
  patch: Partial<DisclosureDraft>,
): OpsLocalRow {
  return {
    key,
    draft: blankDraft(source, { status: 'disclosed', ...patch }),
    saved: null,
  }
}

const method = field('process_method', ['fermented', 'baked'])
const parameter = field('process_parameter')
const storage = field('storage_condition', ['ambient', 'refrigerated'])
const shelf = field('shelf_life_basis', ['best_before', 'use_by'])
const handling = field('handling_note')

afterEach(cleanup)

describe('MadeKeptEditor behavior', () => {
  it('shares provenance and publishing across a making story', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSave = vi.fn()
    const onClearError = vi.fn()
    render(
      <MadeKeptEditor
        kind="made"
        canEdit
        saving={false}
        error="Previous making-story save failed."
        methodField={method}
        paramField={parameter}
        methodRow={row(method, 'method-row', { valueText: 'fermented' })}
        paramRow={row(parameter, 'parameter-row', {
          valueText: '48 hours',
        })}
        onChange={onChange}
        onSave={onSave}
        onClearError={onClearError}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Brand document/i }))
    expect(onClearError).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(
      'process_method',
      'method-row',
      expect.objectContaining({ sourceTier: 'brand_document' }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'process_parameter',
      'parameter-row',
      expect.objectContaining({ sourceTier: 'brand_document' }),
    )

    await user.click(
      screen.getByRole('checkbox', { name: 'Show to shoppers' }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'process_method',
      'method-row',
      expect.objectContaining({ published: true }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'process_parameter',
      'parameter-row',
      expect.objectContaining({ published: true }),
    )

    await user.click(
      screen.getByRole('button', { name: 'Save making story' }),
    )
    expect(onSave).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Previous making-story save failed.'),
    ).toBeTruthy()
  })

  it('disables publishing and saving when the story has no value', () => {
    render(
      <MadeKeptEditor
        kind="made"
        canEdit
        saving={false}
        error={null}
        methodField={method}
        paramField={parameter}
        methodRow={row(method, 'method-row', { valueText: null })}
        paramRow={row(parameter, 'parameter-row', { valueText: null })}
        onChange={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    expect(
      (screen.getByRole('checkbox', {
        name: 'Show to shoppers',
      }) as HTMLInputElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', {
        name: 'Save making story',
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('clears incompatible provenance across a keeping story', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const provenance = {
      sourceTier: 'third_party_verified' as const,
      sourceUrl: 'https://example.com/certificate',
      issuerName: 'Verifier',
      credentialId: 'CERT-1',
    }
    render(
      <MadeKeptEditor
        kind="kept"
        canEdit
        saving={false}
        error={null}
        storageField={storage}
        shelfField={shelf}
        handlingField={handling}
        storageRow={row(storage, 'storage-row', {
          valueText: 'ambient',
          ...provenance,
        })}
        shelfRow={row(shelf, 'shelf-row', {
          valueText: 'best_before',
          ...provenance,
        })}
        handlingRow={row(handling, 'handling-row', {
          valueText: 'Keep sealed.',
          ...provenance,
        })}
        onChange={onChange}
        onSave={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Brand stated/i }))

    for (const [code, key] of [
      ['storage_condition', 'storage-row'],
      ['shelf_life_basis', 'shelf-row'],
      ['handling_note', 'handling-row'],
    ]) {
      expect(onChange).toHaveBeenCalledWith(
        code,
        key,
        expect.objectContaining({
          sourceTier: 'brand_stated',
          sourceUrl: null,
          issuerName: null,
          credentialId: null,
        }),
      )
    }
  })
})
