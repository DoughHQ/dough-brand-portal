// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterSku, ProductMaster } from '@/lib/productMaster/types'
import { PricingTab } from '../PricingTab'
import { useProductMasterWrites } from '../useProductMasterWrites'

const mocks = vi.hoisted(() => ({
  callWriteRpc: vi.fn(),
  fetchProductMaster: vi.fn(),
  upload: vi.fn(),
  rpc: vi.fn(),
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
  product: { product_id: 71, row_version: 9, brand_id: 3 },
  editable_fields: [],
  sku_count: 1,
  skus: [],
  images: [],
  compare_groups: { eligible: [], results: null },
  price: {
    msrp: 4.5,
    observed: { observations: 1, publishable: false, median: null },
    msrp_vs_observed: null,
    price_tier: null,
    min_observations_to_publish: 3,
  },
  dietary: null,
  intelligence: null,
  coverage: null,
  open_corrections: [],
  recent_changes: [],
} as unknown as ProductMaster

const selectedSku = {
  sku_variant_id: 81,
  barcode: '123456789',
  msrp: 4.5,
} as unknown as MasterSku

function Harness() {
  const writes = useProductMasterWrites({
    initial,
    effectiveBrandId: 3,
    canEdit: true,
    isAdmin: false,
  })
  return (
    <>
      {writes.errorMsg ? <div role="alert">{writes.errorMsg}</div> : null}
      <PricingTab
        master={writes.master}
        writes={writes}
        selectedSku={selectedSku}
      />
    </>
  )
}

beforeEach(() => {
  mocks.callWriteRpc.mockReset()
  mocks.fetchProductMaster.mockReset()
  mocks.upload.mockReset()
  mocks.rpc.mockReset()
})

afterEach(cleanup)

describe('PricingTab behavior', () => {
  it('loads and renders the retailer breakdown', async () => {
    let finish: (value: unknown) => void = () => {}
    mocks.callWriteRpc.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const user = userEvent.setup()
    render(<Harness />)

    const button = screen.getByRole('button', {
      name: 'Retailer & metro breakdown',
    })
    await user.click(button)
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeTruthy()

    finish({
      ok: true,
      data: { metros: [{ name: 'Austin', median: 3.99 }] },
    })

    expect(
      await screen.findByText(/"name": "Austin"/),
    ).toBeTruthy()
    expect(mocks.callWriteRpc).toHaveBeenCalledWith(
      expect.anything(),
      'get_product_price_surface',
      { p_product_id: 71 },
    )
  })

  it('shows a price-surface failure without rendering a breakdown', async () => {
    mocks.callWriteRpc.mockResolvedValue({
      ok: false,
      error: { message: 'Price surface is unavailable.' },
    })
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(
      screen.getByRole('button', { name: 'Retailer & metro breakdown' }),
    )

    expect(
      await screen.findByText('Price surface is unavailable.'),
    ).toBeTruthy()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Retailer & metro breakdown' }),
      ).toBeTruthy(),
    )
    expect(screen.queryByText(/metros/)).toBeNull()
  })
})
