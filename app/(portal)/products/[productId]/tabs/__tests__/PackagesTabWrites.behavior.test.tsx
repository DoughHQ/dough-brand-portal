// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductMaster } from '@/lib/productMaster/types'
import { PackagesTab } from '../PackagesTab'
import { useProductMasterWrites } from '../useProductMasterWrites'

const mocks = vi.hoisted(() => ({
  callWriteRpc: vi.fn(),
  fetchProductMaster: vi.fn(),
  upload: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/app/(portal)/products/photoActions', () => ({
  moderateBrandPhotoAction: vi.fn(),
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
    primary_image_url: null,
  },
  editable_fields: ['product_name_display'],
  sku_count: 1,
  skus: [
    {
      sku_variant_id: 81,
      row_version: 4,
      variant_name_display: 'Single bar',
      package_size_value: 40,
      package_size_uom: 'g',
      package_count: 1,
      package_type: 'bar',
      status: 'active',
      is_available: true,
      barcode: '123456789',
      msrp: null,
      ingredients: {
        sku_ingredients_id: 91,
        row_version: 5,
        ingredients_text_raw: 'Oats',
        allergens_contains: null,
        allergens_may_contain: null,
        source_type: null,
        is_human_verified: false,
        evidence_rung: null,
        locked: false,
      },
      nutrition: {
        sku_nutrition_facts_id: 101,
        row_version: 6,
        serving_size_value: 40,
        serving_size_uom: 'g',
        servings_per_container: 1,
        calories: 100,
        total_fat_g: 3,
        saturated_fat_g: 0,
        trans_fat_g: 0,
        cholesterol_mg: 0,
        sodium_mg: 120,
        total_carbs_g: 18,
        dietary_fiber_g: 3,
        total_sugars_g: 5,
        added_sugars_g: 2,
        protein_g: 4,
        vitamin_d_mcg: null,
        calcium_mg: null,
        iron_mg: null,
        potassium_mg: null,
        vitamin_a_mcg: null,
        vitamin_c_mg: null,
        extended_nutrients: {},
        basis_type: null,
        source_type: null,
        is_human_verified: false,
        evidence_rung: null,
        locked: false,
      },
    },
  ],
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
      <PackagesTab
        master={writes.master}
        writes={writes}
        canEdit
        selectedSkuId={81}
        onSelectSku={() => {}}
      />
    </>
  )
}

beforeEach(() => {
  mocks.callWriteRpc.mockReset()
  mocks.fetchProductMaster.mockReset()
  mocks.upload.mockReset()
  mocks.rpc.mockReset()
  mocks.callWriteRpc.mockResolvedValue({ ok: true, data: null })
  mocks.fetchProductMaster.mockResolvedValue({ ok: true, data: initial })
})

afterEach(cleanup)

describe('PackagesTab write behavior', () => {
  it('saves a valid MSRP through the package RPC', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const msrp = screen.getByText('MSRP').parentElement
    expect(msrp).not.toBeNull()

    await user.click(within(msrp as HTMLElement).getByRole('button'))
    await user.type(screen.getByRole('spinbutton'), '4.25')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mocks.callWriteRpc).toHaveBeenCalledWith(
        expect.anything(),
        'set_brand_msrp',
        {
          p_sku_variant_id: 81,
          p_price: 4.25,
          p_currency: 'USD',
        },
      ),
    )
    expect(mocks.fetchProductMaster).toHaveBeenCalled()
  })

  it('rejects a non-positive MSRP before calling the RPC', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const msrp = screen.getByText('MSRP').parentElement

    await user.click(within(msrp as HTMLElement).getByRole('button'))
    await user.type(screen.getByRole('spinbutton'), '0')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Price must be greater than zero.'),
    ).toBeTruthy()
    expect(mocks.callWriteRpc).not.toHaveBeenCalled()
  })

  it('saves edited ingredients with their row version', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Oats' }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Oats, salt')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mocks.callWriteRpc).toHaveBeenCalledWith(
        expect.anything(),
        'update_sku_ingredients',
        {
          p_sku_variant_id: 81,
          p_expected_row_version: 5,
          p_patch: { ingredients_text_raw: 'Oats, salt' },
        },
      ),
    )
  })

  it('saves a nutrition cell with its nutrition row version', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const calories = screen.getByText('Calories').parentElement
    expect(calories).not.toBeNull()

    await user.click(
      within(calories as HTMLElement).getByRole('button', { name: '100' }),
    )
    const draft = within(calories as HTMLElement).getByRole('textbox')
    await user.clear(draft)
    await user.type(draft, '125')
    await user.click(
      within(calories as HTMLElement).getByRole('button', { name: 'Save' }),
    )

    await waitFor(() =>
      expect(mocks.callWriteRpc).toHaveBeenCalledWith(
        expect.anything(),
        'update_sku_nutrition',
        {
          p_sku_variant_id: 81,
          p_expected_row_version: 6,
          p_patch: { calories: 125 },
        },
      ),
    )
  })
})
