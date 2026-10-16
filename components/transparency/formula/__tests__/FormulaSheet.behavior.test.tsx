// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import FormulaSheet, { type FormulaLocalRow } from '../../FormulaSheet'

function field(
  code: string,
  valueKind: ProofSubMetricRow['value_kind'],
): ProofSubMetricRow {
  return {
    sub_metric_code: code,
    label: code,
    definition: '',
    value_kind: valueKind,
    allowed_values: null,
    unit_source: 'none',
    unit: null,
    allowed_units: null,
    requires_method: false,
    allowed_methods: null,
    requires_boundary: false,
    allowed_boundaries: null,
    requires_data_quality: false,
    allowed_data_qualities: null,
    subject_kind_default: 'ingredient',
    metric_code: 'formula',
    sort_order: 0,
  }
}

function row(
  source: ProofSubMetricRow,
  key: string,
  subjectLabel: string,
  patch: Partial<DisclosureDraft>,
): FormulaLocalRow {
  return {
    key,
    draft: blankDraft(source, {
      subjectKind: 'ingredient',
      subjectLabel,
      status: 'disclosed',
      ...patch,
    }),
    saved: null,
  }
}

const percentage = field('ingredient_percentage', 'numeric')
const breakout = field('ingredient_breakout', 'text')

afterEach(cleanup)

describe('FormulaSheet behavior', () => {
  it('edits, publishes, and saves populated formula rows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSave = vi.fn()
    const percentageRow = row(percentage, 'percentage-row', 'Sugar', {
      valueNum: 12,
    })
    const breakoutRow = row(breakout, 'breakout-row', 'Sugar', {
      valueText: 'Cane sugar',
    })
    render(
      <FormulaSheet
        ingredientStatement="SUGAR"
        pctField={percentage}
        breakoutField={breakout}
        pctRows={[percentageRow]}
        breakoutRows={[breakoutRow]}
        canEdit
        savingKey={null}
        errors={{
          'percentage-row': 'Previous amount save failed.',
          'breakout-row': 'Previous breakout save failed.',
        }}
        onChange={onChange}
        onSave={onSave}
        onEnsureRow={vi.fn(() => 'new-row')}
        onAddCustomIngredient={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Sugar/ }))
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '20' },
    })
    expect(onChange).toHaveBeenCalledWith(
      'ingredient_percentage',
      'percentage-row',
      expect.objectContaining({
        status: 'disclosed',
        valueNum: 20,
        valueUnit: null,
      }),
    )

    await user.click(
      screen.getByRole('checkbox', { name: 'Show amount to shoppers' }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'ingredient_percentage',
      'percentage-row',
      expect.objectContaining({ published: true }),
    )

    await user.click(screen.getByRole('button', { name: 'Save amount' }))
    await user.click(screen.getByRole('button', { name: 'Save breakout' }))
    expect(onSave).toHaveBeenNthCalledWith(1, percentage, percentageRow)
    expect(onSave).toHaveBeenNthCalledWith(2, breakout, breakoutRow)
    expect(screen.getByText('Previous amount save failed.')).toBeTruthy()
    expect(screen.getByText('Previous breakout save failed.')).toBeTruthy()
  })

  it('creates missing amount and breakout rows through their editors', async () => {
    const user = userEvent.setup()
    const onEnsureRow = vi.fn(
      (source: ProofSubMetricRow) => `new-${source.sub_metric_code}`,
    )
    const onChange = vi.fn()
    render(
      <FormulaSheet
        ingredientStatement="WATER"
        pctField={percentage}
        breakoutField={breakout}
        pctRows={[]}
        breakoutRows={[]}
        canEdit
        savingKey={null}
        errors={{}}
        onChange={onChange}
        onSave={vi.fn()}
        onEnsureRow={onEnsureRow}
        onAddCustomIngredient={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Water/ }))
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '8.5' },
    })
    fireEvent.change(
      screen.getByPlaceholderText('e.g. orange oil, vanilla extract'),
      { target: { value: 'Filtered water' } },
    )

    expect(onEnsureRow).toHaveBeenCalledWith(percentage, 'Water')
    expect(onEnsureRow).toHaveBeenCalledWith(breakout, 'Water')
    expect(onChange).toHaveBeenCalledWith(
      'ingredient_percentage',
      'new-ingredient_percentage',
      expect.objectContaining({ valueNum: 8.5 }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'ingredient_breakout',
      'new-ingredient_breakout',
      expect.objectContaining({ valueText: 'Filtered water' }),
    )
  })

  it('adds a custom ingredient from the keyboard', async () => {
    const user = userEvent.setup()
    const onAddCustomIngredient = vi.fn()
    render(
      <FormulaSheet
        ingredientStatement={null}
        pctField={percentage}
        breakoutField={breakout}
        pctRows={[]}
        breakoutRows={[]}
        canEdit
        savingKey={null}
        errors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onEnsureRow={vi.fn(() => 'new-row')}
        onAddCustomIngredient={onAddCustomIngredient}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Ingredient not on the label' }),
    )
    await user.type(screen.getByPlaceholderText('e.g. Aspartame'), 'Cocoa{Enter}')

    expect(onAddCustomIngredient).toHaveBeenCalledWith('Cocoa')
    expect(screen.queryByPlaceholderText('e.g. Aspartame')).toBeNull()
  })
})
