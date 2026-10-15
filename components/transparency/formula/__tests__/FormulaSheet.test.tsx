import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import FormulaSheet, { type FormulaLocalRow } from '../../FormulaSheet'
import { AmountBlock } from '../AmountBlock'
import { BreakoutBlock } from '../BreakoutBlock'
import { blankDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'

function field(code: string, valueKind: string): ProofSubMetricRow {
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

const pctField = field('ingredient_pct', 'number')
const breakoutField = field('ingredient_breakout', 'text')

function row(
  f: ProofSubMetricRow,
  key: string,
  subjectLabel: string,
  overrides: Partial<FormulaLocalRow['draft']> = {},
): FormulaLocalRow {
  return { key, draft: blankDraft(f, { subjectLabel, ...overrides }), saved: null }
}

const handlers = {
  onChange: vi.fn(),
  onSave: vi.fn(),
  onEnsureRow: vi.fn(() => 'k'),
  onAddCustomIngredient: vi.fn(),
}

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('FormulaSheet shell', () => {
  it('renders the registry empty state without formula fields', () => {
    const html = renderToStaticMarkup(
      <FormulaSheet
        ingredientStatement="Sugar"
        pctField={null}
        breakoutField={null}
        pctRows={[]}
        breakoutRows={[]}
        canEdit
        savingKey={null}
        errors={{}}
        {...handlers}
      />,
    )
    expect(html).toBe('<div class="tx-empty">No formula fields in the registry.</div>')
  })

  it('renders the empty sheet when nothing is listed', () => {
    const html = renderToStaticMarkup(
      <FormulaSheet
        ingredientStatement={null}
        pctField={pctField}
        breakoutField={null}
        pctRows={[]}
        breakoutRows={[]}
        canEdit={false}
        savingKey={null}
        errors={{}}
        {...handlers}
      />,
    )
    inOrder(html.replaceAll('<!-- -->', ''), [
      'No ingredient statement on this SKU yet. Add one under <strong>Ingredients &amp; nutrition</strong>',
      '<span>Ingredient</span><span>Amount</span><span>Status</span>',
      'Nothing to enrich yet. Add an ingredient to start.',
    ])
    expect(html).not.toContain('Ingredient not on the label')
  })

  it('lists label and custom ingredients with amount and breakout tags', () => {
    const html = renderToStaticMarkup(
      <FormulaSheet
        ingredientStatement="SUGAR, WATER"
        pctField={pctField}
        breakoutField={breakoutField}
        pctRows={[row(pctField, 'p1', 'Sugar', { valueNum: 12 })]}
        breakoutRows={[row(breakoutField, 'b1', 'Aspartame', { valueText: 'E951' })]}
        canEdit
        savingKey={null}
        errors={{}}
        {...handlers}
      />,
    )
    inOrder(html, [
      'Seeded from this SKU’s ingredient statement.',
      '>Sugar<',
      '>12%<',
      '>Water<',
      '>—<',
      '>Aspartame<',
      '>Not on label<',
      '>Breakout<',
      'Ingredient not on the label',
    ])
  })
})

describe('formula blocks', () => {
  it('renders the amount block', () => {
    const html = renderToStaticMarkup(
      <AmountBlock
        field={pctField}
        subject="Sugar"
        row={undefined}
        canEdit
        saving={false}
        error={null}
        onEnsureRow={handlers.onEnsureRow}
        onChange={handlers.onChange}
        onSave={handlers.onSave}
      />,
    )
    expect(html).toContain('How much?')
  })

  it('renders the breakout block', () => {
    const html = renderToStaticMarkup(
      <BreakoutBlock
        field={breakoutField}
        subject="Sugar"
        row={undefined}
        canEdit
        saving={false}
        error={null}
        onEnsureRow={handlers.onEnsureRow}
        onChange={handlers.onChange}
        onSave={handlers.onSave}
      />,
    )
    expect(html).toContain('What’s inside?')
  })
})
