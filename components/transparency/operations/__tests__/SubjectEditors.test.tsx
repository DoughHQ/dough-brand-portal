// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { blankDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'
import SubjectEnumEditor from '../SubjectEnumEditor'
import SubjectTextEditor from '../SubjectTextEditor'

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

afterEach(cleanup)

describe('SubjectEnumEditor', () => {
  it('creates a row and emits a disclosed ingredient draft on first selection', async () => {
    const user = userEvent.setup()
    const onEnsureRow = vi.fn(() => 'new-row')
    const onChange = vi.fn()

    render(
      <SubjectEnumEditor
        field={field}
        subject="Olive oil"
        row={undefined}
        canEdit
        saving={false}
        error={null}
        onEnsureRow={onEnsureRow}
        onChange={onChange}
        onSave={vi.fn()}
      />
    )

    await user.selectOptions(screen.getByRole('combobox'), 'unrefined')

    expect(onEnsureRow).toHaveBeenCalledWith(field, 'Olive oil')
    expect(onChange).toHaveBeenCalledWith(
      'refinement_state',
      'new-row',
      expect.objectContaining({
        subjectKind: 'ingredient',
        subjectLabel: 'Olive oil',
        status: 'disclosed',
        valueText: 'unrefined',
      })
    )
  })
})

describe('SubjectTextEditor', () => {
  it('creates a row and emits text from the first edit', () => {
    const onEnsureRow = vi.fn(() => 'new-row')
    const onChange = vi.fn()

    render(
      <SubjectTextEditor
        field={field}
        subject="Natural flavors"
        row={undefined}
        canEdit
        saving={false}
        error={null}
        placeholder="Flavor details"
        onEnsureRow={onEnsureRow}
        onChange={onChange}
        onSave={vi.fn()}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Orange oil and vanilla extract' },
    })

    expect(onEnsureRow).toHaveBeenCalledWith(field, 'Natural flavors')
    expect(onChange).toHaveBeenCalledWith(
      'refinement_state',
      'new-row',
      expect.objectContaining({
        subjectKind: 'ingredient',
        subjectLabel: 'Natural flavors',
        status: 'disclosed',
        valueText: 'Orange oil and vanilla extract',
      })
    )
  })

  it('publishes and saves an existing row through its user controls', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSave = vi.fn()
    const row = {
      key: 'existing-row',
      draft: blankDraft(field, {
        subjectKind: 'ingredient',
        subjectLabel: 'Natural flavors',
        status: 'disclosed',
        valueText: 'Orange oil',
      }),
      saved: null,
    }

    render(
      <SubjectTextEditor
        field={field}
        subject="Natural flavors"
        row={row}
        canEdit
        saving={false}
        error={null}
        placeholder="Flavor details"
        onEnsureRow={vi.fn()}
        onChange={onChange}
        onSave={onSave}
      />
    )

    await user.click(screen.getByRole('checkbox', { name: /show to shoppers/i }))
    expect(onChange).toHaveBeenCalledWith(
      'refinement_state',
      'existing-row',
      expect.objectContaining({ published: true })
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(field, row)
  })
})
