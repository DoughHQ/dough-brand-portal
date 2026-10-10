import { describe, expect, it } from 'vitest'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import {
  buildFieldsByChapter,
  calculateProgressByChapter,
  calculateTotals,
  depthSummary,
  selectDefaultChapter,
} from '../progress'
import type { LocalRow, RowsByMetric } from '../types'

function field(
  subMetricCode: string,
  metricCode: string,
  subjectKind = 'whole_product',
): ProofSubMetricRow {
  return {
    sub_metric_code: subMetricCode,
    label: subMetricCode,
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
    subject_kind_default: subjectKind,
    metric_code: metricCode,
    sort_order: 1,
  }
}

function row(
  target: ProofSubMetricRow,
  key: string,
  patch: Partial<DisclosureDraft>,
): LocalRow {
  const draft = blankDraft(target, {
    disclosureId: 1,
    valueText: 'value',
    ...patch,
  })
  return { key, draft, saved: draft }
}

function add(rows: RowsByMetric, target: ProofSubMetricRow, item: LocalRow) {
  rows[target.sub_metric_code] = [
    ...(rows[target.sub_metric_code] ?? []),
    item,
  ]
}

describe('studio chapter progress', () => {
  it('calculates the five chapter models and overall totals', () => {
    const pcf = field('product_carbon_footprint', 'product_footprint')
    const pack = field('packaging_primary_material', 'packaging', 'component')
    const land = field('soil_practice', 'land_and_soil')

    const welfare = field('animal_welfare_standard', 'animal_welfare')
    const labor = field('labor_standard_alignment', 'labor_standards')
    const risk = field('risk_certification', 'sourcing_risk', 'ingredient')

    const country = field('origin_country', 'origin', 'ingredient')
    const coverage = field('origin_coverage_pct', 'origin')
    const facility = field('facility_name', 'supply_chain', 'facility')

    const process = field('process_method', 'process')
    const refinement = field('refinement_state', 'treatments', 'ingredient')
    const flavor = field(
      'natural_flavor_composition',
      'additives',
      'ingredient',
    )
    const aid = field('processing_aid_disclosed', 'additives', 'ingredient')

    const percentage = field(
      'ingredient_percentage',
      'ingredients',
      'ingredient',
    )
    const breakout = field(
      'sub_ingredient_breakout',
      'ingredients',
      'ingredient',
    )
    const fields = [
      pcf,
      pack,
      land,
      welfare,
      labor,
      risk,
      country,
      coverage,
      facility,
      process,
      refinement,
      flavor,
      aid,
      percentage,
      breakout,
    ]
    const rows: RowsByMetric = {}

    add(rows, pcf, row(pcf, 'pcf', { published: false }))
    add(
      rows,
      pack,
      row(pack, 'pack', { subjectLabel: 'Bottle', published: true }),
    )
    add(
      rows,
      land,
      row(land, 'land', { disclosureId: null, valueText: null }),
    )

    add(rows, welfare, row(welfare, 'welfare', { published: true }))
    add(rows, labor, row(labor, 'labor', { published: false }))
    add(
      rows,
      risk,
      row(risk, 'risk', {
        subjectLabel: 'Cocoa',
        status: 'not_disclosed',
        valueText: null,
        published: false,
      }),
    )

    add(
      rows,
      country,
      row(country, 'finished-origin', {
        subjectLabel: 'Finished product',
        published: true,
      }),
    )
    add(
      rows,
      country,
      row(country, 'cocoa-origin', {
        subjectLabel: 'Cocoa',
        published: false,
      }),
    )
    add(rows, coverage, row(coverage, 'coverage', { published: true }))
    add(
      rows,
      facility,
      row(facility, 'facility', {
        subjectLabel: 'Factory',
        published: false,
      }),
    )

    add(rows, process, row(process, 'process', { published: true }))
    add(
      rows,
      refinement,
      row(refinement, 'oil', {
        subjectLabel: 'Olive oil',
        published: false,
      }),
    )
    add(
      rows,
      flavor,
      row(flavor, 'flavor', {
        subjectLabel: 'Natural flavors',
        published: true,
      }),
    )
    add(
      rows,
      aid,
      row(aid, 'aid', { subjectLabel: 'Enzyme', published: true }),
    )

    add(
      rows,
      percentage,
      row(percentage, 'sugar-pct', {
        subjectLabel: 'Sugar',
        published: false,
      }),
    )
    add(
      rows,
      breakout,
      row(breakout, 'sugar-breakout', {
        subjectLabel: 'Sugar',
        published: true,
      }),
    )
    add(
      rows,
      percentage,
      row(percentage, 'cocoa-pct', {
        subjectLabel: 'Cocoa',
        published: true,
      }),
    )

    const progress = calculateProgressByChapter({
      fieldsByChapter: buildFieldsByChapter(fields),
      rowsByMetric: rows,
      ingredientStatement: 'Sugar, cocoa, olive oil, natural flavors',
    })

    expect(progress.planet).toEqual({ total: 3, started: 2, published: 1 })
    expect(progress.rights).toEqual({ total: 3, started: 3, published: 1 })
    expect(progress.origin).toEqual({ total: 7, started: 4, published: 2 })
    expect(progress.operations).toEqual({ total: 4, started: 4, published: 3 })
    expect(progress.formula).toEqual({ total: 4, started: 2, published: 2 })
    expect(calculateTotals(progress)).toEqual({
      published: 9,
      privateN: 6,
      untouched: 6,
    })
    expect(selectDefaultChapter(progress)).toBe('origin')
    expect(depthSummary('planet', progress, rows, null)).toBe('PCF · 1 pack')
    expect(depthSummary('origin', progress, rows, null)).toBe('4 places')
    expect(depthSummary('formula', progress, rows, null)).toBe('2 ingredients')
    expect(depthSummary('operations', progress, rows, null)).toBe('3/4 live')
    expect(depthSummary('rights', progress, rows, null)).toBe('1/3 live')
  })
})
