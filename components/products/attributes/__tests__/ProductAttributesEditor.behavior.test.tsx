// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeclarableFacetRow } from '@/lib/facets/productFacets'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  declareProductFacet: vi.fn(),
  fetchDeclarableFacets: vi.fn(),
  withdrawProductFacetDeclaration: vi.fn(),
}))

vi.mock('@/components/products/productFacets.css', () => ({}))
vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))
vi.mock('@/lib/facets/api', () => ({
  declareProductFacet: mocks.declareProductFacet,
  fetchDeclarableFacets: mocks.fetchDeclarableFacets,
  withdrawProductFacetDeclaration: mocks.withdrawProductFacetDeclaration,
}))

import ProductAttributesEditor from '../../ProductAttributesEditor'

const client = { rpc: vi.fn() }
const dietRow: DeclarableFacetRow = {
  facet_type: 'diet',
  display_name: 'Diet',
  cardinality: 'multi',
  polarity: 'positive',
  assignability: 'brand',
  editable: true,
  requires_evidence: false,
  available_values: [
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Keto' },
  ],
  derived_values: null,
  declared_values: null,
}

beforeEach(() => {
  mocks.createClient.mockReset()
  mocks.createClient.mockReturnValue(client)
  mocks.fetchDeclarableFacets.mockReset()
  mocks.fetchDeclarableFacets.mockResolvedValue({
    rows: [dietRow],
    error: null,
  })
  mocks.declareProductFacet.mockReset()
  mocks.declareProductFacet.mockResolvedValue({
    declarationId: 17,
    error: null,
  })
  mocks.withdrawProductFacetDeclaration.mockReset()
})

afterEach(cleanup)

describe('ProductAttributesEditor behavior', () => {
  it('declares an attribute, reloads the dossier, and reports the change', async () => {
    const onChanged = vi.fn()
    const user = userEvent.setup()
    render(<ProductAttributesEditor productId={41} onChanged={onChanged} />)

    await user.click(await screen.findByRole('button', { name: /Diet/ }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Add diet…' }),
      'vegan',
    )

    expect(mocks.declareProductFacet).toHaveBeenCalledWith(client, {
      productId: 41,
      facetType: 'diet',
      facetValue: 'vegan',
      evidenceUrl: null,
      evidenceNote: null,
    })
    await waitFor(() => expect(mocks.fetchDeclarableFacets).toHaveBeenCalledTimes(2))
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('shows a declaration failure without reloading or reporting a change', async () => {
    mocks.declareProductFacet.mockResolvedValue({
      declarationId: null,
      error: 'The attribute could not be saved.',
    })
    const onChanged = vi.fn()
    const user = userEvent.setup()
    render(<ProductAttributesEditor productId={41} onChanged={onChanged} />)

    await user.click(await screen.findByRole('button', { name: /Diet/ }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Add diet…' }),
      'keto',
    )

    expect(await screen.findByText('The attribute could not be saved.')).toBeTruthy()
    expect(mocks.fetchDeclarableFacets).toHaveBeenCalledOnce()
    expect(onChanged).not.toHaveBeenCalled()
  })
})
