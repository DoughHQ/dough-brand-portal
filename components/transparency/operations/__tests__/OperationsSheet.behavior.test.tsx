// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import OperationsSheet, {
  OPS_MADE_CODES,
  type OpsLocalRow,
} from '../../OperationsSheet'

function field(
  code: string,
  allowedValues: string[] | null = null,
  subjectKind = 'whole_product',
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
    subject_kind_default: subjectKind,
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

const handlers = {
  onChange: vi.fn(),
  onEnsureRow: vi.fn(() => 'new-row'),
  onSaveRow: vi.fn(),
  onSaveBundle: vi.fn(),
}

afterEach(() => {
  cleanup()
  for (const handler of Object.values(handlers)) handler.mockClear()
})

describe('OperationsSheet behavior', () => {
  it('routes a making story through the operations bundle', async () => {
    const user = userEvent.setup()
    const method = field('process_method', ['fermented', 'baked'])
    const parameter = field('process_parameter')
    render(
      <OperationsSheet
        ingredientStatement={null}
        fieldsByCode={{
          process_method: method,
          process_parameter: parameter,
        }}
        rowsByCode={{
          process_method: [
            row(method, 'method-row', { valueText: 'fermented' }),
          ],
          process_parameter: [
            row(parameter, 'parameter-row', { valueText: '48 hours' }),
          ],
        }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        {...handlers}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Save making story' }),
    )
    expect(handlers.onSaveBundle).toHaveBeenCalledWith(
      OPS_MADE_CODES,
      'ops-made',
    )
    expect(handlers.onSaveRow).not.toHaveBeenCalled()
  })

  it('seeds an oil refinement row from the ingredient label', async () => {
    const user = userEvent.setup()
    const refinement = field(
      'refinement_state',
      ['refined', 'unrefined'],
      'ingredient',
    )
    render(
      <OperationsSheet
        ingredientStatement="OLIVE OIL, SALT"
        fieldsByCode={{ refinement_state: refinement }}
        rowsByCode={{}}
        canEdit
        savingKey={null}
        storyError="Previous operations save failed."
        errors={{}}
        {...handlers}
      />,
    )

    expect(screen.getByText('Previous operations save failed.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Olive Oil/ }))
    await user.selectOptions(screen.getByRole('combobox'), 'unrefined')

    expect(handlers.onEnsureRow).toHaveBeenCalledWith(refinement, 'Olive Oil')
    expect(handlers.onChange).toHaveBeenCalledWith(
      'refinement_state',
      'new-row',
      expect.objectContaining({
        subjectKind: 'ingredient',
        subjectLabel: 'Olive Oil',
        valueText: 'unrefined',
      }),
    )
  })

  it('keeps whole-product treatment saves on the row boundary', async () => {
    const user = userEvent.setup()
    const pasteurization = field('pasteurization_method', [
      'pasteurized',
      'unpasteurized',
    ])
    const pasteurizationRow = row(pasteurization, 'pasteur-row', {
      valueText: 'pasteurized',
    })
    render(
      <OperationsSheet
        ingredientStatement={null}
        fieldsByCode={{ pasteurization_method: pasteurization }}
        rowsByCode={{ pasteurization_method: [pasteurizationRow] }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        {...handlers}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox'), 'unpasteurized')
    expect(handlers.onChange).toHaveBeenCalledWith(
      'pasteurization_method',
      'pasteur-row',
      expect.objectContaining({
        status: 'disclosed',
        valueText: 'unpasteurized',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(handlers.onSaveRow).toHaveBeenCalledWith(
      pasteurization,
      pasteurizationRow,
    )
    expect(handlers.onSaveBundle).not.toHaveBeenCalled()
  })
})
