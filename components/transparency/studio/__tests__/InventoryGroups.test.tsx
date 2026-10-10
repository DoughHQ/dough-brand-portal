// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { blankDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'
import InventoryGroups from '../InventoryGroups'

const field: ProofSubMetricRow = {
  sub_metric_code: 'risk_certification',
  label: 'Risk certification',
  definition: 'test',
  value_kind: 'text',
  allowed_values: null,
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
  metric_code: 'sourcing_risk',
  sort_order: 1,
}

afterEach(cleanup)

describe('InventoryGroups', () => {
  it('opens inventory rows and newly created subject rows', async () => {
    const user = userEvent.setup()
    const onOpenKeyChange = vi.fn()
    const onAddSubjectRow = vi.fn(() => 'new-row')
    const row = {
      key: 'blank-row',
      draft: blankDraft(field),
      saved: null,
    }

    render(
      <InventoryGroups
        groups={[{ metricCode: 'sourcing_risk', label: 'Risk', fields: [field] }]}
        chapterGroupCount={1}
        rowsByMetric={{ risk_certification: [row] }}
        canEdit
        savingKey={null}
        errors={{}}
        openKey={null}
        onOpenKeyChange={onOpenKeyChange}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAddSubjectRow={onAddSubjectRow}
      />
    )

    const rowButton = screen.getByText('Tap to disclose').closest('button')
    expect(rowButton).not.toBeNull()
    await user.click(rowButton!)
    expect(onOpenKeyChange).toHaveBeenCalledWith('blank-row')

    await user.click(screen.getByRole('button', { name: 'Add another ingredient' }))
    expect(onAddSubjectRow).toHaveBeenCalledWith(field)
    expect(onOpenKeyChange).toHaveBeenCalledWith('new-row')
  })
})
