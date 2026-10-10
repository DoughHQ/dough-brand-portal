import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductMaster } from '../types'
import {
  useProductMasterWrites,
  type ProductMasterWrites,
} from '../../../app/(portal)/products/[productId]/tabs/useProductMasterWrites'

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
  product: {
    product_id: 71,
    row_version: 9,
    brand_id: 3,
    primary_image_url: null,
  },
  editable_fields: ['product_name_display'],
  sku_count: 1,
  skus: [
    {
      sku_variant_id: 81,
      row_version: 4,
      variant_name_display: null,
      package_size_value: null,
      package_size_uom: null,
      package_count: null,
      package_type: null,
      status: 'active',
      is_available: true,
      barcode: null,
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
        extended_nutrients: {},
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

function renderHook(): ProductMasterWrites {
  let current: ProductMasterWrites | null = null
  function Harness() {
    current = useProductMasterWrites({
      initial,
      effectiveBrandId: 3,
      canEdit: true,
      isAdmin: false,
    })
    return null
  }
  renderToStaticMarkup(createElement(Harness))
  if (!current) throw new Error('Hook did not render')
  return current
}

beforeEach(() => {
  mocks.callWriteRpc.mockReset()
  mocks.fetchProductMaster.mockReset()
  mocks.upload.mockReset()
  mocks.rpc.mockReset()
  mocks.callWriteRpc.mockResolvedValue({ ok: true, data: null })
  mocks.fetchProductMaster.mockResolvedValue({ ok: true, data: initial })
  mocks.upload.mockResolvedValue({ error: null })
})

describe('useProductMasterWrites RPC contract', () => {
  it('preserves identity optimistic-concurrency arguments', async () => {
    const writes = renderHook()

    await writes.saveIdentity('product_name_display', 'New name')

    expect(mocks.callWriteRpc).toHaveBeenCalledWith(
      expect.anything(),
      'update_product_fields',
      {
        p_product_id: 71,
        p_expected_row_version: 9,
        p_patch: { product_name_display: 'New name' },
      }
    )
  })

  it('preserves SKU price, ingredient, and nutrition arguments', async () => {
    const writes = renderHook()
    const sku = initial.skus[0]

    await writes.saveMsrp(sku, '4.25')
    await writes.saveIngredients(sku, 'Oats, salt')
    await writes.saveNutritionField(sku, 'sodium_mg', '120')

    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'set_brand_msrp',
      {
        p_sku_variant_id: 81,
        p_price: 4.25,
        p_currency: 'USD',
      }
    )
    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'update_sku_ingredients',
      {
        p_sku_variant_id: 81,
        p_expected_row_version: 5,
        p_patch: { ingredients_text_raw: 'Oats, salt' },
      }
    )
    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      'update_sku_nutrition',
      {
        p_sku_variant_id: 81,
        p_expected_row_version: 6,
        p_patch: { sodium_mg: 120 },
      }
    )
  })

  it('preserves image storage and registration arguments', async () => {
    const writes = renderHook()
    const file = { name: 'front shot.png', type: 'image/png' } as File

    await writes.uploadImage(file)
    await writes.promoteImage(301)

    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^3\/\d+-front_shot\.png$/),
      file,
      { upsert: false, contentType: 'image/png' }
    )
    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'register_brand_product_image',
      {
        p_product_id: 71,
        p_image_role: 'front',
        p_storage_path: expect.stringMatching(/^3\/\d+-front_shot\.png$/),
        p_sku_variant_id: null,
        p_supersede_image_id: null,
        p_make_primary: true,
      }
    )
    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'set_primary_product_image',
      { p_product_image_id: 301 }
    )
  })
})
