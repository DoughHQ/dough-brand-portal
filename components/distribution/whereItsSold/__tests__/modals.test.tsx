// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchCombobox from '../SearchCombobox'
import AddPlaceModal from '../modals/AddPlaceModal'
import DelistModal from '../modals/DelistModal'
import DisputeModal from '../modals/DisputeModal'
import ModalFrame from '../modals/ModalFrame'
import NationwideConfirmModal from '../modals/NationwideConfirmModal'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  fetchShoppableRetailers: vi.fn(),
  fetchRetailerRegions: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/distribution/api', () => ({
  fetchShoppableRetailers: mocks.fetchShoppableRetailers,
  fetchRetailerRegions: mocks.fetchRetailerRegions,
}))

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  mocks.createClient.mockReturnValue({ client: true })
  mocks.fetchShoppableRetailers.mockResolvedValue({
    retailers: [
      {
        id: 7,
        name: 'Market Basket',
        parent_retailer_id: null,
        retailer_type: 'grocery',
      },
    ],
    error: null,
  })
  mocks.fetchRetailerRegions.mockResolvedValue({
    regions: [
      {
        geo_region_id: 11,
        region_type: 'state',
        region_name: 'Massachusetts',
        region_code: 'MA',
      },
    ],
    error: null,
  })
})

afterEach(cleanup)

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('Where its sold modals', () => {
  it('supports keyboard selection in the searchable combobox', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onClose = vi.fn()
    render(
      <ModalFrame
        title="Choose a retailer"
        description="Pick one retailer."
        busy={false}
        onClose={onClose}
      >
        <SearchCombobox
          label="Retailer"
          options={Array.from({ length: 8 }, (_, index) => ({
            id: String(index + 1),
            label: `Retailer ${index + 1}`,
          }))}
          valueId={null}
          placeholder="Search retailers…"
          onChange={onChange}
        />
      </ModalFrame>,
    )

    const combobox = screen.getByRole('combobox', { name: 'Retailer' })
    await user.click(combobox)
    for (const option of screen.getAllByRole('option')) {
      expect((option as HTMLElement).tabIndex).toBe(-1)
    }
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    await user.click(combobox)
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('validates add-place fields before submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <AddPlaceModal
        multiVariant
        skus={[{ sku_variant_id: 3, label: '12 oz' }]}
        rows={[]}
        busy={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Market Basket' })).toBeTruthy(),
    )

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Pick a retailer.')).toBeTruthy()

    fireEvent.change(screen.getAllByRole('combobox')[0]!, {
      target: { value: '7' },
    })
    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'Massachusetts (MA)' }),
      ).toBeTruthy(),
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Pick a state or metro.')).toBeTruthy()

    fireEvent.change(screen.getAllByRole('combobox')[1]!, {
      target: { value: '11' },
    })
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(
      screen.getByText('Choose which pack sizes this applies to.'),
    ).toBeTruthy()

    fireEvent.change(screen.getAllByRole('combobox')[2]!, {
      target: { value: '3' },
    })
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onSubmit).toHaveBeenCalledWith({
      retailerId: 7,
      scopeLevel: 'region',
      geoRegionId: 11,
      skuVariantId: 3,
      afterCorrectCoord: undefined,
      afterCorrectNote: undefined,
    })
  })

  it('requires a correction note and preserves the corrected coordinate', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <AddPlaceModal
        multiVariant={false}
        skus={[]}
        prefill={{
          retailer_id: 7,
          scope_level: 'region',
          geo_region_id: 11,
          retail_location_id: null,
          sku_variant_id: null,
          afterCorrect: true,
        }}
        rows={[]}
        busy={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Save correction' }))
    expect(
      screen.getByText('Add a short note explaining the correction.'),
    ).toBeTruthy()
    await user.type(
      screen.getByPlaceholderText('Required — what should have been reported?'),
      'Wrong state',
    )
    await user.click(screen.getByRole('button', { name: 'Save correction' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        retailerId: 7,
        geoRegionId: 11,
        afterCorrectCoord: {
          retailer_id: 7,
          scope_level: 'region',
          geo_region_id: 11,
          retail_location_id: null,
          sku_variant_id: null,
        },
        afterCorrectNote: 'Wrong state',
      }),
    )
  })

  it('ignores regions returned for a previously selected retailer', async () => {
    const firstRegions = deferred<{
      regions: {
        geo_region_id: number
        region_type: string
        region_name: string
        region_code: string
      }[]
      error: null
    }>()
    const secondRegions = deferred<{
      regions: {
        geo_region_id: number
        region_type: string
        region_name: string
        region_code: string
      }[]
      error: null
    }>()
    mocks.fetchShoppableRetailers.mockResolvedValue({
      retailers: [
        {
          id: 7,
          name: 'Market Basket',
          parent_retailer_id: null,
          retailer_type: 'grocery',
        },
        {
          id: 8,
          name: 'Whole Foods',
          parent_retailer_id: null,
          retailer_type: 'grocery',
        },
      ],
      error: null,
    })
    mocks.fetchRetailerRegions
      .mockReturnValueOnce(firstRegions.promise)
      .mockReturnValueOnce(secondRegions.promise)
    render(
      <AddPlaceModal
        multiVariant={false}
        skus={[]}
        rows={[]}
        busy={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Whole Foods' })).toBeTruthy(),
    )

    const retailer = screen.getAllByRole('combobox')[0]!
    fireEvent.change(retailer, { target: { value: '7' } })
    await waitFor(() =>
      expect(mocks.fetchRetailerRegions).toHaveBeenCalledWith(
        { client: true },
        7,
      ),
    )
    fireEvent.change(retailer, { target: { value: '8' } })
    await waitFor(() =>
      expect(mocks.fetchRetailerRegions).toHaveBeenCalledWith(
        { client: true },
        8,
      ),
    )
    secondRegions.resolve({
      regions: [
        {
          geo_region_id: 22,
          region_type: 'state',
          region_name: 'New York',
          region_code: 'NY',
        },
      ],
      error: null,
    })
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'New York (NY)' })).toBeTruthy(),
    )
    firstRegions.resolve({
      regions: [
        {
          geo_region_id: 11,
          region_type: 'state',
          region_name: 'Massachusetts',
          region_code: 'MA',
        },
      ],
      error: null,
    })
    await firstRegions.promise

    expect(
      screen.queryByRole('option', { name: 'Massachusetts (MA)' }),
    ).toBeNull()
    expect(screen.getByRole('option', { name: 'New York (NY)' })).toBeTruthy()
  })

  it('clears the previous retailer regions while the next request loads', async () => {
    const nextRegions = deferred<{
      regions: {
        geo_region_id: number
        region_type: string
        region_name: string
        region_code: string
      }[]
      error: null
    }>()
    mocks.fetchShoppableRetailers.mockResolvedValue({
      retailers: [
        {
          id: 7,
          name: 'Market Basket',
          parent_retailer_id: null,
          retailer_type: 'grocery',
        },
        {
          id: 8,
          name: 'Whole Foods',
          parent_retailer_id: null,
          retailer_type: 'grocery',
        },
      ],
      error: null,
    })
    mocks.fetchRetailerRegions
      .mockResolvedValueOnce({
        regions: [
          {
            geo_region_id: 11,
            region_type: 'state',
            region_name: 'Massachusetts',
            region_code: 'MA',
          },
        ],
        error: null,
      })
      .mockReturnValueOnce(nextRegions.promise)
    render(
      <AddPlaceModal
        multiVariant={false}
        skus={[]}
        rows={[]}
        busy={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Whole Foods' })).toBeTruthy(),
    )

    const retailer = screen.getAllByRole('combobox')[0]!
    fireEvent.change(retailer, { target: { value: '7' } })
    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'Massachusetts (MA)' }),
      ).toBeTruthy(),
    )
    fireEvent.change(retailer, { target: { value: '7' } })
    expect(
      screen.getByRole('option', { name: 'Massachusetts (MA)' }),
    ).toBeTruthy()
    expect(mocks.fetchRetailerRegions).toHaveBeenCalledTimes(1)

    fireEvent.change(retailer, { target: { value: '8' } })

    await waitFor(() =>
      expect(
        screen.queryByRole('option', { name: 'Massachusetts (MA)' }),
      ).toBeNull(),
    )
    await act(async () => {
      nextRegions.resolve({ regions: [], error: null })
      await nextRegions.promise
    })
  })

  it('exposes nationwide back/confirm transitions and locks while busy', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const { rerender } = render(
      <NationwideConfirmModal
        pending={{
          retailerId: 7,
          scopeLevel: 'national',
          geoRegionId: null,
          skuVariantId: null,
        }}
        busy={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(
      screen.getByRole('button', { name: 'Confirm nationwide' }),
    )
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('dialog', { name: 'Confirm nationwide' }),
    ).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(2)

    rerender(
      <NationwideConfirmModal
        pending={{
          retailerId: 7,
          scopeLevel: 'national',
          geoRegionId: null,
          skuVariantId: null,
        }}
        busy
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )
    expect(
      (screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (
        screen.getByRole('button', {
          name: 'Confirm nationwide',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('validates dispute text and disables destructive modal controls when busy', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { rerender } = render(
      <DisputeModal
        place="Market Basket · Massachusetts"
        busy={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    expect(
      (screen.getByRole('button', { name: 'Dispute' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    await user.type(screen.getByPlaceholderText('Required'), 'Not sold here')
    await user.click(screen.getByRole('button', { name: 'Dispute' }))
    expect(onSubmit).toHaveBeenCalledWith('Not sold here')

    rerender(
      <DelistModal
        coveredByNational
        busy
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(
      (screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (
        screen.getByRole('button', {
          name: 'Mark delisted',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    expect(
      screen.getByText(/A nationwide claim still covers this banner/),
    ).toBeTruthy()
  })
})
