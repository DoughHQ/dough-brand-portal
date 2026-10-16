// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import PlanetSheet, {
  DEFAULT_PACK_COMPONENTS,
  PLANET_PCF_CODES,
  type PlanetLocalRow,
} from '../../PlanetSheet'

function field(
  code: string,
  {
    kind = 'text',
    allowedValues = null,
    subjectKind = 'whole_product',
  }: {
    kind?: ProofSubMetricRow['value_kind']
    allowedValues?: string[] | null
    subjectKind?: string
  } = {},
): ProofSubMetricRow {
  return {
    sub_metric_code: code,
    label: code,
    definition: '',
    value_kind: kind,
    allowed_values: allowedValues,
    unit_source: 'none',
    unit: kind === 'numeric' ? 'kgCO2e_per_kg' : null,
    allowed_units: kind === 'numeric' ? ['kgCO2e_per_kg'] : null,
    requires_method: false,
    allowed_methods: null,
    requires_boundary: false,
    allowed_boundaries: null,
    requires_data_quality: false,
    allowed_data_qualities: null,
    subject_kind_default: subjectKind,
    metric_code: 'planet',
    sort_order: 0,
  }
}

function row(
  source: ProofSubMetricRow,
  key: string,
  patch: Partial<DisclosureDraft>,
): PlanetLocalRow {
  return {
    key,
    draft: blankDraft(source, { status: 'disclosed', ...patch }),
    saved: null,
  }
}

const pcf = field('product_carbon_footprint', { kind: 'numeric' })
const assurance = field('pcf_assurance_level', {
  kind: 'enum',
  allowedValues: ['limited', 'reasonable'],
})
const material = field('packaging_primary_material', {
  kind: 'enum',
  allowedValues: ['plastic', 'glass'],
  subjectKind: 'component',
})
const disposal = field('packaging_disposal_route', {
  kind: 'enum',
  allowedValues: ['recycle', 'landfill'],
  subjectKind: 'component',
})

afterEach(cleanup)

describe('PlanetSheet behavior', () => {
  it('shares footprint provenance and saves the PCF bundle', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSaveBundle = vi.fn()
    const onClearStoryError = vi.fn()
    const pcfRow = row(pcf, 'pcf-row', { valueNum: 2.4 })
    const assuranceRow = row(assurance, 'assurance-row', {
      valueText: 'limited',
    })
    render(
      <PlanetSheet
        fieldsByCode={{
          product_carbon_footprint: pcf,
          pcf_assurance_level: assurance,
        }}
        rowsByCode={{
          product_carbon_footprint: [pcfRow],
          pcf_assurance_level: [assuranceRow],
        }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        onChange={onChange}
        onEnsureRow={vi.fn(() => 'new-row')}
        onSaveRow={vi.fn()}
        onSaveBundle={onSaveBundle}
        onClearStoryError={onClearStoryError}
        onSeedPackComponents={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Brand document/i }))

    expect(onClearStoryError).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(
      'product_carbon_footprint',
      'pcf-row',
      expect.objectContaining({ sourceTier: 'brand_document' }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'pcf_assurance_level',
      'assurance-row',
      expect.objectContaining({ sourceTier: 'brand_document' }),
    )

    await user.click(screen.getByRole('button', { name: 'Save footprint' }))
    expect(onSaveBundle).toHaveBeenCalledWith(
      PLANET_PCF_CODES,
      'planet-pcf',
    )
  })

  it('keeps an empty footprint unsavable and displays its failure', () => {
    render(
      <PlanetSheet
        fieldsByCode={{ product_carbon_footprint: pcf }}
        rowsByCode={{
          product_carbon_footprint: [row(pcf, 'pcf-row', { valueNum: null })],
        }}
        canEdit
        savingKey={null}
        storyError="Could not save the footprint."
        errors={{}}
        onChange={vi.fn()}
        onEnsureRow={vi.fn(() => 'new-row')}
        onSaveRow={vi.fn()}
        onSaveBundle={vi.fn()}
        onSeedPackComponents={vi.fn()}
      />,
    )

    expect(
      (screen.getByRole('button', {
        name: 'Save footprint',
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getByText('Could not save the footprint.')).toBeTruthy()
  })

  it('edits and saves only populated packaging rows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSaveRow = vi.fn()
    const materialRow = row(material, 'material-row', {
      subjectKind: 'component',
      subjectLabel: 'Bottle',
      valueText: 'plastic',
    })
    const disposalRow = row(disposal, 'disposal-row', {
      subjectKind: 'component',
      subjectLabel: 'Bottle',
      valueText: null,
    })
    render(
      <PlanetSheet
        fieldsByCode={{
          packaging_primary_material: material,
          packaging_disposal_route: disposal,
        }}
        rowsByCode={{
          packaging_primary_material: [materialRow],
          packaging_disposal_route: [disposalRow],
        }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{ 'material-row': 'Previous material save failed.' }}
        onChange={onChange}
        onEnsureRow={vi.fn(() => 'new-row')}
        onSaveRow={onSaveRow}
        onSaveBundle={vi.fn()}
        onSeedPackComponents={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Bottle/ }))
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, 'glass')
    expect(onChange).toHaveBeenCalledWith(
      'packaging_primary_material',
      'material-row',
      expect.objectContaining({ valueText: 'glass' }),
    )
    expect(screen.getByText('Previous material save failed.')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save component' }))
    expect(onSaveRow).toHaveBeenCalledOnce()
    expect(onSaveRow).toHaveBeenCalledWith(material, materialRow)
  })

  it('seeds defaults and creates a named packaging component', async () => {
    const user = userEvent.setup()
    const onEnsureRow = vi.fn(() => 'new-material')
    const onSeedPackComponents = vi.fn()
    render(
      <PlanetSheet
        fieldsByCode={{ packaging_primary_material: material }}
        rowsByCode={{}}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        onChange={vi.fn()}
        onEnsureRow={onEnsureRow}
        onSaveRow={vi.fn()}
        onSaveBundle={vi.fn()}
        onSeedPackComponents={onSeedPackComponents}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seed Bottle, Cap, Sleeve' }),
    )
    expect(onSeedPackComponents).toHaveBeenCalledWith([
      ...DEFAULT_PACK_COMPONENTS,
    ])

    await user.click(
      screen.getByRole('button', { name: 'Add packaging component' }),
    )
    await user.type(screen.getByPlaceholderText('e.g. Tray'), 'Tray')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onEnsureRow).toHaveBeenCalledWith(material, 'Tray')
  })
})
