// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductMaster } from '@/lib/productMaster/types'
import { OverviewTab } from '../OverviewTab'
import { useProductMasterWrites } from '../useProductMasterWrites'

const mocks = vi.hoisted(() => ({
  callWriteRpc: vi.fn(),
  fetchProductMaster: vi.fn(),
  upload: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/components/distribution/WhereItsSoldSection', () => ({
  default: () => null,
}))
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    storage: { from: () => ({ upload: mocks.upload }) },
    rpc: mocks.rpc,
  }),
}))
vi.mock('@/lib/productMaster/fetch', () => ({
  callWriteRpc: mocks.callWriteRpc,
  fetchProductMaster: mocks.fetchProductMaster,
}))

const initial = {
  product: {
    product_id: 71,
    row_version: 9,
    brand_id: 3,
    brand_name: 'Acme',
    product_name_display: 'Oat bar',
    category_path: 'Food / Snacks',
    l3_confidence_score: null,
  },
  editable_fields: [],
  sku_count: 0,
  skus: [],
  images: [],
  compare_groups: { eligible: [], results: null },
  price: {
    msrp: null,
    observed: { observations: 0, publishable: false, median: null },
    msrp_vs_observed: null,
    price_tier: null,
  },
  dietary: null,
  intelligence: null,
  coverage: null,
  open_corrections: [],
  recent_changes: [],
} as unknown as ProductMaster

function Harness({ isAdmin }: { isAdmin: boolean }) {
  const writes = useProductMasterWrites({
    initial,
    effectiveBrandId: 3,
    canEdit: true,
    isAdmin,
  })
  return (
    <OverviewTab
      master={writes.master}
      writes={writes}
      canEdit
      isAdmin={isAdmin}
    />
  )
}

beforeEach(() => {
  mocks.callWriteRpc.mockReset()
  mocks.fetchProductMaster.mockReset()
  mocks.upload.mockReset()
  mocks.rpc.mockReset()
})

afterEach(cleanup)

describe('Overview competitor search behavior', () => {
  it('filters the brand stub list and removes a selected competitor', async () => {
    const user = userEvent.setup()
    render(<Harness isAdmin={false} />)

    await user.click(
      screen.getByRole('button', { name: 'Request a category change' }),
    )
    const search = screen.getByPlaceholderText('Search products…')
    await user.type(search, 'b')
    expect(screen.queryByRole('button', { name: 'Clif Bar Chocolate Chip' })).toBeNull()
    expect(mocks.rpc).not.toHaveBeenCalled()

    await user.type(search, 'a')
    const result = screen.getByRole('button', {
      name: 'Clif Bar Chocolate Chip',
    })
    await user.click(result)
    expect((result as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: '×' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: '×' }))
    expect(
      (screen.getByRole('button', {
        name: 'Clif Bar Chocolate Chip',
      }) as HTMLButtonElement).disabled,
    ).toBe(false)
  })

  it('uses admin search results and stops at five competitors', async () => {
    mocks.rpc.mockResolvedValue({
      data: Array.from({ length: 6 }, (_, index) => ({
        product_id: index + 1,
        product_name_clean: `Competitor ${index + 1}`,
      })),
      error: null,
    })
    const user = userEvent.setup()
    render(<Harness isAdmin />)

    await user.click(
      screen.getByRole('button', { name: 'Request a category change' }),
    )
    await user.type(screen.getByPlaceholderText('Search products…'), 'co')

    expect(mocks.rpc).toHaveBeenCalledWith('search_products_admin', {
      p_query: 'co',
    })
    for (const id of [1, 2, 3, 4, 5]) {
      await user.click(screen.getByRole('button', { name: `Competitor ${id}` }))
    }

    expect(
      (screen.getByRole('button', {
        name: 'Competitor 6',
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getAllByRole('button', { name: '×' })).toHaveLength(5)
  })
})
