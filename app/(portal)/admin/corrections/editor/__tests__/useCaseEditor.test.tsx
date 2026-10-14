// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { useCaseEditor } from '../useCaseEditor'

const { searchBrandsAction, searchTaxonomyAction } = vi.hoisted(() => ({
  searchBrandsAction: vi.fn(),
  searchTaxonomyAction: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('../../actions', () => ({
  searchBrandsAction,
  searchTaxonomyAction,
}))

function row(overrides: Record<string, unknown> = {}): CorrectionReviewRow {
  return {
    id: 'c1',
    product_id: 4,
    product_name_short: 'Maple bar',
    variants: [],
    variant_count: 0,
    proposed_value: null,
    correction_type: 'category',
    ...overrides,
  } as unknown as CorrectionReviewRow
}

function renderEditor(overrides: Record<string, unknown> = {}, busy = false) {
  return renderHook(() => useCaseEditor({ row: row(overrides), busy }))
}

describe('useCaseEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    searchBrandsAction.mockReset()
    searchTaxonomyAction.mockReset()
    searchBrandsAction.mockResolvedValue([])
    searchTaxonomyAction.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refuses to file a category until one is picked', () => {
    const { result } = renderEditor()
    expect(result.current.applyLabel).toBe('File in this category')
    expect(result.current.applyDisabled).toBe(true)
    expect(result.current.cleanPayload()).toEqual({ taxonomy_node_id: null })
  })

  it('names the category it is ready to file', () => {
    const { result } = renderEditor({
      proposed_taxonomy_node_id: 9,
      proposed_category_label: 'Oat milk',
    })
    expect(result.current.applyLabel).toBe('File in Oat milk')
    expect(result.current.applyDisabled).toBe(false)
    expect(result.current.cleanPayload()).toEqual({ taxonomy_node_id: 9 })
  })

  it('searches categories after the query settles', async () => {
    renderEditor()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    expect(searchTaxonomyAction).toHaveBeenCalledWith('Maple bar')
  })

  it('flags nutrition that cannot fit in the serving', () => {
    const { result } = renderEditor({
      correction_type: 'nutrition_facts',
      extracted_value: {
        basis_type: 'per_serving',
        serving_size_uom: 'g',
        serving_size_value: 10,
        total_fat_g: 20,
        total_carbs_g: 0,
        protein_g: 0,
      },
    })
    expect(result.current.hint).toBe(
      'These values sum to 20.0 g but the serving is 10 g. Are these per-100g?',
    )
    expect(result.current.applyDisabled).toBe(true)
    expect(result.current.noVariants).toBe(true)
  })

  it('trims a name and says when the save is in flight', () => {
    const { result } = renderEditor(
      { correction_type: 'name', proposed_value: { name: '  Maple bar  ' } },
      true,
    )
    expect(result.current.applyLabel).toBe('Applying…')
    expect(result.current.cleanPayload()).toEqual({ name: 'Maple bar' })
  })
})
