import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'

const seeded: unknown[] = []
let budget = 0
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: (init: unknown) => {
      if (budget > 0) {
        budget--
        return [seeded.shift(), () => {}]
      }
      return actual.useState(init)
    },
  }
})
vi.mock('@/lib/supabase', () => ({ createClient: () => ({}) }))
vi.mock('@/components/transparency/transparencyStudio.css', () => ({}))

const studioState: Record<string, unknown> = {}
vi.mock('@/components/transparency/studio/useTransparencyStudio', () => ({
  default: () => studioState,
}))

import ProductTransparencyStudio from '../../ProductTransparencyStudio'

const field = (metric: string, code: string): ProofSubMetricRow => ({
  sub_metric_code: code,
  label: `Label ${code}`,
  definition: 'Definition',
  value_kind: 'text' as ProofSubMetricRow['value_kind'],
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
  subject_kind_default: 'whole_product',
  metric_code: metric,
  sort_order: 1,
})

function render(over: Record<string, unknown>, chapter = 'planet') {
  for (const key of Object.keys(studioState)) delete studioState[key]
  Object.assign(studioState, {
    fields: [
      field('land_and_soil', 'land_practice'),
      field('process', 'process_note'),
      field('supply_chain', 'facility_name'),
    ],
    metrics: [{ metric_code: 'land_and_soil', label: 'Land and soil' }],
    rowsByMetric: {},
    loading: false,
    loadError: null,
    savingKey: null,
    storyError: null,
    errors: {},
    canEdit: true,
    loadVersion: 1,
    setStoryError: () => {},
    updateRow: () => {},
    ensureSubjectRow: () => {},
    addCustomIngredient: () => {},
    addSubjectRow: () => 'key',
    handleSave: async () => null,
    handleSaveOriginStory: async () => {},
    handleSaveBundle: async () => {},
    ...over,
  })
  seeded.length = 0
  seeded.push(chapter, null, 0)
  budget = 3
  const html = renderToStaticMarkup(
    <ProductTransparencyStudio productId={1} brandId={2} canEdit ingredientStatement="Water" />,
  )
  budget = 0
  return html.replaceAll('<!-- -->', '')
}

function inOrder(html: string, parts: string[]) {
  let cursor = 0
  for (const part of parts) {
    const at = html.indexOf(part, cursor)
    expect(at, part).toBeGreaterThanOrEqual(0)
    cursor = at + part.length
  }
}

describe('ProductTransparencyStudio', () => {
  it('renders loading and load-error states', () => {
    expect(render({ loading: true })).toContain('Loading transparency registry…')
    const failed = render({ loadError: 'Registry unavailable' })
    expect(failed).toContain('Registry unavailable')
    expect(failed).not.toContain('tx-rail')
  })

  it('renders header, rail, and the planet pane with its inventory aside', () => {
    const html = render({})
    inOrder(html, [
      'P.R.O.O.F. · Product transparency',
      'not started',
      'aria-label="P.R.O.O.F. chapters"',
      'Planet',
      'Rights',
      'Origin',
      'Operations',
      'Formula',
      'tx-pane__title">Planet',
      'Land &amp; corporate',
      'Land and soil',
    ])
  })

  it('renders the operations chapter and the origin journey aside', () => {
    expect(render({}, 'operations')).toContain('tx-pane__title">Operations')
    inOrder(render({}, 'origin'), ['tx-pane__title">Origin', 'Journey', 'supply_chain'])
  })

  it('renders the empty-chapter message', () => {
    expect(render({ fields: [field('process', 'process_note')] }, 'formula')).toContain(
      'No product fields in this chapter yet.',
    )
  })
})
