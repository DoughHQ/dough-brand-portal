// @vitest-environment jsdom

import { act, cleanup, render, renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductMaster } from '@/lib/productMaster/types'
import { ProductImageFileInput } from '../ProductImageFileInput'
import { useProductMasterNav } from '../useProductMasterNav'

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}))

function masterWithSkus(...ids: number[]): ProductMaster {
  return {
    skus: ids.map((sku_variant_id) => ({ sku_variant_id })),
  } as unknown as ProductMaster
}

beforeEach(() => {
  mocks.replace.mockReset()
  mocks.searchParams = new URLSearchParams()
})

afterEach(cleanup)

describe('product master navigation behavior', () => {
  it('keeps tab and SKU selections synchronized with the URL', () => {
    mocks.searchParams = new URLSearchParams('tab=nutrition&sku=2')
    const initial = masterWithSkus(1, 2)
    const args = { initial, master: initial, productId: 9 }
    const { result } = renderHook(() => useProductMasterNav(args))

    expect(result.current.tab).toBe('nutrition')
    expect(result.current.skuId).toBe(2)

    act(() => result.current.selectTab('images'))
    expect(mocks.replace).toHaveBeenNthCalledWith(
      1,
      '/products/9?tab=images&sku=2',
      { scroll: false },
    )

    act(() => result.current.selectSku(1))
    expect(mocks.replace).toHaveBeenNthCalledWith(
      2,
      '/products/9?tab=images&sku=1',
      { scroll: false },
    )
  })

  it('falls back from invalid URL values and omits a lone SKU', () => {
    mocks.searchParams = new URLSearchParams('tab=unknown&sku=999')
    const initial = masterWithSkus(11)
    const args = { initial, master: initial, productId: 9 }
    const { result } = renderHook(() => useProductMasterNav(args))

    expect(result.current.tab).toBe('overview')
    expect(result.current.skuId).toBe(11)

    act(() => result.current.selectSku(11))
    expect(mocks.replace).toHaveBeenCalledWith('/products/9', {
      scroll: false,
    })
  })
})

describe('ProductImageFileInput behavior', () => {
  it('uploads the chosen image as primary and clears the file input', async () => {
    const uploadImage = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const { container } = render(
      <ProductImageFileInput
        uploading={false}
        hasPrimaryImage={false}
        uploadImage={uploadImage}
      />,
    )
    const input = container.querySelector<HTMLInputElement>(
      '#pm-product-image-file',
    )
    expect(input).not.toBeNull()
    const file = new File(['image'], 'snack.png', { type: 'image/png' })

    await user.upload(input as HTMLInputElement, file)

    expect(uploadImage).toHaveBeenCalledWith(file, { makePrimary: true })
    expect(input?.value).toBe('')
    expect(input?.files).toHaveLength(0)
  })

  it('does not replace an existing primary image', async () => {
    const uploadImage = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const { container } = render(
      <ProductImageFileInput
        uploading={false}
        hasPrimaryImage
        uploadImage={uploadImage}
      />,
    )
    const input = container.querySelector<HTMLInputElement>(
      '#pm-product-image-file',
    )
    const file = new File(['image'], 'alternate.webp', {
      type: 'image/webp',
    })

    await user.upload(input as HTMLInputElement, file)

    expect(uploadImage).toHaveBeenCalledWith(file, { makePrimary: false })
  })
})
