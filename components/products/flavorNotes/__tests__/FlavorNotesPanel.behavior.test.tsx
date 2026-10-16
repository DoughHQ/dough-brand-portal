// @vitest-environment jsdom

import { useState } from 'react'
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  DeclarableFacetRow,
  FacetDeclaredValue,
} from '@/lib/facets/productFacets'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  declareProductFacet: vi.fn(),
  onWrote: vi.fn(),
  withdrawProductFacetDeclaration: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))
vi.mock('@/lib/facets/api', () => ({
  declareProductFacet: mocks.declareProductFacet,
  withdrawProductFacetDeclaration: mocks.withdrawProductFacetDeclaration,
}))

import { FlavorNotesPanel } from '../../FlavorNotesPanel'
import { useFlavorNotes } from '../useFlavorNotes'

const client = { rpc: vi.fn() }
const citrus: FacetDeclaredValue = {
  value: 'citrus',
  declaration_id: 1,
  review_state: 'auto_accepted',
  label: 'Citrus',
  brand_note: 'Bright',
}
const row: DeclarableFacetRow = {
  facet_type: 'flavor_note',
  display_name: 'Flavour Notes',
  cardinality: 'multi',
  polarity: 'positive',
  assignability: 'brand',
  editable: true,
  requires_evidence: false,
  available_values: [
    { value: 'mint', label: 'Mint' },
    { value: 'citrus', label: 'Citrus' },
  ],
  derived_values: null,
  declared_values: [
    citrus,
    {
      value: 'vanilla',
      declaration_id: 2,
      review_state: 'pending_review',
      label: 'Vanilla',
    },
  ],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function FlavorHarness() {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      {error ? <p role="alert">{error}</p> : null}
      <FlavorNotesPanel
        row={row}
        productId={9}
        canEdit
        busyKey={busyKey}
        setBusyKey={setBusyKey}
        setError={setError}
        onWrote={() => mocks.onWrote()}
      />
    </>
  )
}

beforeEach(() => {
  mocks.createClient.mockReset()
  mocks.createClient.mockReturnValue(client)
  mocks.declareProductFacet.mockReset()
  mocks.declareProductFacet.mockResolvedValue({
    declarationId: 21,
    error: null,
  })
  mocks.withdrawProductFacetDeclaration.mockReset()
  mocks.withdrawProductFacetDeclaration.mockResolvedValue({
    ok: true,
    error: null,
  })
  mocks.onWrote.mockReset()
  mocks.onWrote.mockResolvedValue(undefined)
})

afterEach(cleanup)

describe('FlavorNotesPanel behavior', () => {
  it('adds a draft note and disables every competing action while it saves', async () => {
    const request = deferred<{ declarationId: number | null; error: string | null }>()
    mocks.declareProductFacet.mockReturnValueOnce(request.promise)
    const user = userEvent.setup()
    render(<FlavorHarness />)

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Add a flavour note…' }),
      'mint',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Your tasting note (optional)' }),
      'Finishes cold and clean.',
    )
    await user.click(screen.getByRole('button', { name: 'Add with note' }))

    expect(mocks.declareProductFacet).toHaveBeenCalledWith(client, {
      productId: 9,
      facetType: 'flavor_note',
      facetValue: 'mint',
      brandNote: 'Finishes cold and clean.',
    })
    expect((screen.getByRole('button', { name: 'Saving…' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(
      (screen.getByRole('button', { name: 'Remove Citrus' }) as HTMLButtonElement).disabled,
    ).toBe(true)

    await act(async () => {
      request.resolve({ declarationId: 21, error: null })
      await request.promise
    })
    await waitFor(() => expect(mocks.onWrote).toHaveBeenCalledOnce())
  })

  it('edits an existing tasting note', async () => {
    const user = userEvent.setup()
    render(<FlavorHarness />)

    await user.click(screen.getByRole('button', { name: 'Edit note' }))
    const note = screen.getByRole('textbox', { name: 'Your tasting note' })
    expect((note as HTMLTextAreaElement).value).toBe('Bright')
    await user.clear(note)
    await user.type(note, 'Bright and zesty')
    await user.click(screen.getByRole('button', { name: 'Save note' }))

    expect(mocks.declareProductFacet).toHaveBeenCalledWith(client, {
      productId: 9,
      facetType: 'flavor_note',
      facetValue: 'citrus',
      brandNote: 'Bright and zesty',
    })
    await waitFor(() => expect(mocks.onWrote).toHaveBeenCalledOnce())
  })

  it('rejects an empty edit with the dedicated clearing message', async () => {
    const setError = vi.fn()
    const { result } = renderHook(() =>
      useFlavorNotes({
        row,
        productId: 9,
        canEdit: true,
        busyKey: null,
        setBusyKey: vi.fn(),
        setError,
        onWrote: mocks.onWrote,
      }),
    )

    act(() => result.current.setEditNote('   '))
    await act(async () => {
      await result.current.saveEdit(citrus)
    })

    expect(setError).toHaveBeenCalledWith(
      'Tasting notes can’t be cleared here yet — withdraw and re-add if you need a blank note.',
    )
    expect(mocks.declareProductFacet).not.toHaveBeenCalled()
  })

  it('withdraws a declared note and refreshes the parent', async () => {
    const user = userEvent.setup()
    render(<FlavorHarness />)

    await user.click(screen.getByRole('button', { name: 'Remove Citrus' }))

    expect(mocks.withdrawProductFacetDeclaration).toHaveBeenCalledWith(client, 1, false)
    await waitFor(() => expect(mocks.onWrote).toHaveBeenCalledOnce())
  })
})
