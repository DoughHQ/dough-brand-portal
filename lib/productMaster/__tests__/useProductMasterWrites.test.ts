// @vitest-environment jsdom

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moderateBrandPhotoAction } from '@/app/(portal)/products/photoActions'
import { humanizeRpcError } from '@/lib/productMaster/errors'
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
  uploadBrandProductPhoto: vi.fn(),
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

vi.mock('@/lib/productMaster/brandPhoto', () => ({
  uploadBrandProductPhoto: (...args: unknown[]) => mocks.uploadBrandProductPhoto(...args),
}))

vi.mock('@/app/(portal)/products/photoActions', () => ({
  moderateBrandPhotoAction: vi.fn(),
}))

const PUBLISHED = `3/products/${'a'.repeat(64)}.jpg`

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

function renderOnce(): ProductMasterWrites {
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
  mocks.uploadBrandProductPhoto.mockReset()
  mocks.callWriteRpc.mockResolvedValue({ ok: true, data: null })
  mocks.fetchProductMaster.mockResolvedValue({ ok: true, data: initial })
  mocks.upload.mockResolvedValue({ error: null })
})

afterEach(() => {
  cleanup()
})

describe('useProductMasterWrites RPC contract', () => {
  it('preserves identity optimistic-concurrency arguments', async () => {
    const writes = renderOnce()

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
    const writes = renderOnce()
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

  it('registers the moderated publish path and still promotes', async () => {
    mocks.uploadBrandProductPhoto.mockResolvedValue({
      ok: true,
      storagePath: PUBLISHED,
      publicUrl: 'https://example.test/pack.jpg',
    })
    const { result } = renderHook(() =>
      useProductMasterWrites({
        initial,
        effectiveBrandId: 99,
        canEdit: true,
        isAdmin: false,
      }),
    )
    const file = new File(['png'], 'front shot.png', { type: 'image/png' })

    await act(async () => {
      await result.current.uploadImage(file)
      await result.current.promoteImage(301)
    })

    expect(result.current.uploading).toBe(false)
    expect(mocks.uploadBrandProductPhoto).toHaveBeenCalledWith({
      supabase: expect.anything(),
      brandId: 3,
      file,
      moderate: moderateBrandPhotoAction,
    })
    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'register_brand_product_image',
      {
        p_product_id: 71,
        p_image_role: 'front',
        p_storage_path: PUBLISHED,
        p_sku_variant_id: null,
        p_supersede_image_id: null,
        p_make_primary: true,
      },
    )
    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'set_primary_product_image',
      { p_product_image_id: 301 },
    )
  })

  it('shows a helper failure and does not register', async () => {
    mocks.uploadBrandProductPhoto.mockResolvedValue({ ok: false, message: 'X' })
    const { result } = renderHook(() =>
      useProductMasterWrites({
        initial,
        effectiveBrandId: 3,
        canEdit: true,
        isAdmin: false,
      }),
    )
    await act(async () => {
      await result.current.uploadImage(new File(['x'], 'a.png', { type: 'image/png' }))
    })
    expect(result.current.errorMsg).toBe('X')
    expect(result.current.uploading).toBe(false)
    expect(mocks.callWriteRpc).not.toHaveBeenCalled()
  })

  it('shows a register failure and clears the spinner', async () => {
    mocks.uploadBrandProductPhoto.mockResolvedValue({
      ok: true,
      storagePath: PUBLISHED,
      publicUrl: null,
    })
    mocks.callWriteRpc.mockResolvedValue({
      ok: false,
      error: { message: 'used', hint: 'PHOTO_IN_USE' },
    })
    const { result } = renderHook(() =>
      useProductMasterWrites({
        initial,
        effectiveBrandId: 3,
        canEdit: true,
        isAdmin: false,
      }),
    )
    await act(async () => {
      await result.current.uploadImage(new File(['x'], 'a.png', { type: 'image/png' }))
    })
    expect(result.current.errorMsg).toBe(humanizeRpcError({ hint: 'PHOTO_IN_USE' }))
    expect(result.current.errorMsg).toBe('That photo is already on a product. Use a different photo.')
    expect(humanizeRpcError({ hint: 'IMAGE_NOT_MODERATED' })).toBe(
      'That photo hasn’t passed our check yet. Upload it again.',
    )
    expect(result.current.uploading).toBe(false)
  })

  it('clears the spinner when the helper throws', async () => {
    mocks.uploadBrandProductPhoto.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() =>
      useProductMasterWrites({
        initial,
        effectiveBrandId: 3,
        canEdit: true,
        isAdmin: false,
      }),
    )
    await act(async () => {
      await expect(
        result.current.uploadImage(new File(['x'], 'a.png', { type: 'image/png' })),
      ).rejects.toThrow('boom')
    })
    expect(result.current.uploading).toBe(false)
    expect(mocks.callWriteRpc).not.toHaveBeenCalled()
  })
})
