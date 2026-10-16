// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CategoryLauncherError,
  type BrandCategoryLauncher,
  type CategoryLauncherRow,
} from '@/lib/categoryLauncher'

const mocks = vi.hoisted(() => ({
  getBrandCategoryLauncher: vi.fn(),
}))

vi.mock('@/lib/categoryLauncher', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/categoryLauncher')>()
  return {
    ...actual,
    getBrandCategoryLauncher: mocks.getBrandCategoryLauncher,
  }
})
vi.mock('@/components/categories/categoriesPage.css', () => ({}))

import CategoryLauncher from '../CategoryLauncher'

function category(
  id: number,
  partial: Partial<CategoryLauncherRow> = {},
): CategoryLauncherRow {
  return {
    l2_id: id,
    l2_name: `Category ${id}`,
    l1_name: `Department ${id}`,
    banner_image_url: null,
    icon_name: null,
    total_products: 2,
    products_with_battles: 1,
    total_battles: 5,
    entitled: false,
    ...partial,
  }
}

function launcher(
  partial: Partial<BrandCategoryLauncher> = {},
): BrandCategoryLauncher {
  return {
    owned: [],
    has_products: [],
    browse: [],
    search: null,
    ...partial,
  }
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  mocks.getBrandCategoryLauncher.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('CategoryLauncher behavior', () => {
  it('debounces search while preserving the baseline ownership tiers', async () => {
    mocks.getBrandCategoryLauncher
      .mockResolvedValueOnce(
        launcher({
          owned: [category(1, { l2_name: 'Owned snacks', entitled: true })],
          has_products: [category(2, { l2_name: 'Active drinks' })],
          browse: [category(3, { l2_name: 'Original browse result' })],
        }),
      )
      .mockResolvedValueOnce(
        launcher({
          owned: [category(9, { l2_name: 'Wrong searched ownership' })],
          browse: [category(4, { l2_name: 'Snack search result' })],
          search: 'snack',
        }),
      )
    render(<CategoryLauncher brandName="Acme" adjacentCategories={[]} />)
    await flushPromises()

    expect(mocks.getBrandCategoryLauncher).toHaveBeenNthCalledWith(1, null)
    expect(screen.getByText('Owned snacks')).toBeTruthy()
    expect(screen.getByText('Active drinks')).toBeTruthy()
    expect(screen.getByText('Original browse result')).toBeTruthy()

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search browse categories' }),
      { target: { value: 'snack' } },
    )
    act(() => vi.advanceTimersByTime(279))
    expect(mocks.getBrandCategoryLauncher).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(mocks.getBrandCategoryLauncher).toHaveBeenNthCalledWith(2, 'snack')
    expect(screen.getByText('Owned snacks')).toBeTruthy()
    expect(screen.getByText('Active drinks')).toBeTruthy()
    expect(screen.queryByText('Wrong searched ownership')).toBeNull()
    expect(screen.getByText('Snack search result')).toBeTruthy()
  })

  it('shows the active-workspace error returned by the launcher', async () => {
    mocks.getBrandCategoryLauncher.mockRejectedValue(
      new CategoryLauncherError(
        'no_effective_brand',
        'Your session does not have an active brand workspace.',
      ),
    )
    render(<CategoryLauncher brandName="Acme" adjacentCategories={[]} />)
    await flushPromises()

    expect(screen.getByText('Couldn’t load categories')).toBeTruthy()
    expect(
      screen.getByText(
        'Your session does not have an active brand workspace.',
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('falls back to an empty launcher after a generic failure', async () => {
    mocks.getBrandCategoryLauncher.mockRejectedValue(
      new Error('network unavailable'),
    )
    render(<CategoryLauncher brandName="Acme" adjacentCategories={[]} />)
    await flushPromises()

    expect(screen.queryByText('Couldn’t load categories')).toBeNull()
    expect(screen.getByText('Ready to explore')).toBeTruthy()
    expect(
      screen.getByText('No other categories to browse right now.'),
    ).toBeTruthy()
  })
})
