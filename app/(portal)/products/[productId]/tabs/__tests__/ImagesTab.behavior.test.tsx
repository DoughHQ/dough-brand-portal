// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductMaster } from '@/lib/productMaster/types'
import { ImagesTab } from '../ImagesTab'
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
    primary_image_url: 'https://cdn.example/primary.png',
  },
  editable_fields: [],
  sku_count: 0,
  skus: [],
  images: [
    {
      product_image_id: 1,
      sku_variant_id: null,
      image_role: 'front',
      public_url: 'https://cdn.example/primary.png',
      is_primary: true,
      evidence_rung: null,
      source_type: null,
      captured_at: null,
      superseded_by_id: null,
    },
    {
      product_image_id: 2,
      sku_variant_id: null,
      image_role: 'front',
      public_url: 'https://cdn.example/alternate.png',
      is_primary: false,
      evidence_rung: null,
      source_type: null,
      captured_at: null,
      superseded_by_id: null,
    },
    {
      product_image_id: 3,
      sku_variant_id: null,
      image_role: 'front',
      public_url: 'https://cdn.example/old.png',
      is_primary: false,
      evidence_rung: null,
      source_type: null,
      captured_at: null,
      superseded_by_id: 1,
    },
  ],
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

function Harness({ canEdit = true }: { canEdit?: boolean }) {
  const writes = useProductMasterWrites({
    initial,
    effectiveBrandId: 3,
    canEdit,
    isAdmin: false,
  })
  return (
    <>
      {writes.flash ? <div role="status">{writes.flash}</div> : null}
      {writes.errorMsg ? <div role="alert">{writes.errorMsg}</div> : null}
      <ImagesTab master={writes.master} writes={writes} canEdit={canEdit} />
    </>
  )
}

beforeEach(() => {
  mocks.callWriteRpc.mockReset()
  mocks.fetchProductMaster.mockReset()
  mocks.upload.mockReset()
  mocks.rpc.mockReset()
  mocks.fetchProductMaster.mockResolvedValue({ ok: true, data: initial })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  vi.mocked(window.confirm).mockRestore()
  cleanup()
})

describe('ImagesTab behavior', () => {
  it('promotes only a current alternate image', async () => {
    mocks.callWriteRpc.mockResolvedValue({ ok: true, data: null })
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByText('Primary')).toBeTruthy()
    expect(screen.getByText('History')).toBeTruthy()
    const promote = screen.getAllByRole('button', { name: 'Make primary' })
    expect(promote).toHaveLength(1)

    await user.click(promote[0]!)
    await waitFor(() =>
      expect(mocks.callWriteRpc).toHaveBeenCalledWith(
        expect.anything(),
        'set_primary_product_image',
        { p_product_image_id: 2 },
      ),
    )
    expect(mocks.fetchProductMaster).toHaveBeenCalled()
  })

  it('shows a promotion failure without reloading the product', async () => {
    mocks.callWriteRpc.mockResolvedValue({
      ok: false,
      error: { message: 'Could not promote this image.' },
    })
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Make primary' }))

    expect(
      await screen.findByText('Could not promote this image.'),
    ).toBeTruthy()
    expect(mocks.fetchProductMaster).not.toHaveBeenCalled()
  })

  it('removes a photo after confirmation and reloads the product', async () => {
    mocks.callWriteRpc.mockResolvedValue({ ok: true, data: { removed: true } })
    const user = userEvent.setup()
    render(<Harness />)

    const remove = screen.getAllByRole('button', { name: 'Remove' })
    expect(remove).toHaveLength(3)

    await user.click(remove[0]!)

    expect(window.confirm).toHaveBeenCalledWith('Remove this photo?')
    await waitFor(() =>
      expect(mocks.callWriteRpc).toHaveBeenCalledWith(
        expect.anything(),
        'remove_brand_product_image',
        { p_product_image_id: 1 },
      ),
    )
    expect((await screen.findByRole('status')).textContent).toBe('Photo removed')
    expect(mocks.fetchProductMaster).toHaveBeenCalled()
  })

  it('leaves the photo in place when removal is declined', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[1]!)

    expect(mocks.callWriteRpc).not.toHaveBeenCalled()
    expect(mocks.fetchProductMaster).not.toHaveBeenCalled()
  })

  it('shows a missing photo without reloading the product', async () => {
    mocks.callWriteRpc.mockResolvedValue({
      ok: false,
      error: { message: 'photo 2 not found', hint: 'IMAGE_NOT_FOUND' },
    })
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[1]!)

    expect((await screen.findByRole('alert')).textContent).toBe('That photo is already gone.')
    expect(mocks.fetchProductMaster).not.toHaveBeenCalled()
  })

  it('hides removal when the product cannot be edited', () => {
    render(<Harness canEdit={false} />)

    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Make primary' })).toBeNull()
  })
})
