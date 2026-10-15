// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'

const mockedStudio = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
}))

vi.mock('@/components/transparency/transparencyStudio.css', () => ({}))
vi.mock('@/components/transparency/studio/useTransparencyStudio', () => ({
  default: () => mockedStudio.state,
}))
vi.mock('@/components/transparency/PlanetSheet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/transparency/PlanetSheet')>()),
  default: () => <div>Planet sheet</div>,
}))
vi.mock('@/components/transparency/RightsSheet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/transparency/RightsSheet')>()),
  default: () => <div>Rights sheet</div>,
}))
vi.mock('@/components/transparency/OriginSheet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/transparency/OriginSheet')>()),
  default: () => <div>Origin sheet</div>,
}))
vi.mock('@/components/transparency/OperationsSheet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/transparency/OperationsSheet')>()),
  default: () => <div>Operations sheet</div>,
}))
vi.mock('@/components/transparency/FormulaSheet', () => ({
  default: () => <div>Formula sheet</div>,
}))

import ProductTransparencyStudio from '../../ProductTransparencyStudio'

function field(metricCode: string, subMetricCode: string): ProofSubMetricRow {
  return {
    sub_metric_code: subMetricCode,
    label: subMetricCode,
    definition: 'Definition',
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
    subject_kind_default: 'whole_product',
    metric_code: metricCode,
    sort_order: 1,
  }
}

beforeEach(() => {
  mockedStudio.state = {
    fields: [
      field('product_footprint', 'product_carbon_footprint'),
      field('labor_standards', 'labor_policy'),
      field('origin', 'origin_country'),
      field('process', 'process_method'),
      field('ingredients', 'ingredient_percentage'),
    ],
    metrics: [],
    rowsByMetric: {},
    loading: false,
    loadError: null,
    savingKey: null,
    storyError: null,
    errors: {},
    canEdit: true,
    loadVersion: 0,
    setStoryError: vi.fn(),
    updateRow: vi.fn(),
    ensureSubjectRow: vi.fn(),
    addCustomIngredient: vi.fn(),
    addSubjectRow: vi.fn(() => 'new-row'),
    handleSave: vi.fn(),
    handleSaveOriginStory: vi.fn(),
    handleSaveBundle: vi.fn(),
  }
})

afterEach(cleanup)

describe('ProductTransparencyStudio behavior', () => {
  it('navigates through every P.R.O.O.F. chapter and marks the active chapter', async () => {
    const user = userEvent.setup()
    render(
      <ProductTransparencyStudio
        productId={1}
        brandId={2}
        canEdit
        ingredientStatement="Water"
      />,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Planet' })).toBeTruthy()

    for (const chapter of ['Rights', 'Origin', 'Operations', 'Formula']) {
      const chapterButton = screen.getByRole('button', {
        name: new RegExp(`^${chapter}`),
      })
      await user.click(chapterButton)

      expect(screen.getByRole('heading', { level: 3, name: chapter })).toBeTruthy()
      expect(chapterButton.getAttribute('aria-current')).toBe('page')
    }

    expect(
      screen
        .getByRole('button', { name: /^Planet/ })
        .getAttribute('aria-current'),
    ).toBeNull()
  })
})
