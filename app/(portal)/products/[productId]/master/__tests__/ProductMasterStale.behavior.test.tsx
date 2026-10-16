// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductMaster } from '@/lib/productMaster/types'
import { StaleWritePanel } from '../../tabs/StaleWritePanel'
import {
  useProductMasterWrites,
  type StaleState,
} from '../../tabs/useProductMasterWrites'

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
    brand_name: 'Acme',
    product_name_display: 'Server name',
    primary_image_url: null,
  },
  editable_fields: ['product_name_display'],
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
  recent_changes: [
    {
      field_name: 'product_name_display',
      old_value: 'Old server name',
      new_value: 'Server name',
      actor_kind: 'user',
      actor_label: 'Another editor',
      actor_display_name: null,
      evidence_rung: null,
      changed_at: '2026-10-15T12:00:00.000Z',
    },
  ],
} as unknown as ProductMaster

const fresh = {
  ...initial,
  product: { ...initial.product, row_version: 10 },
} as ProductMaster

function staleState(): StaleState {
  return {
    fieldName: 'product_name_display',
    localValue: 'My product name',
    change: initial.recent_changes[0]!,
    pendingPatch: { product_name_display: 'My product name' },
    retry: vi.fn(),
  }
}

beforeEach(() => {
  mocks.callWriteRpc.mockReset()
  mocks.fetchProductMaster.mockReset()
  mocks.upload.mockReset()
  mocks.rpc.mockReset()
})

afterEach(cleanup)

describe('StaleWritePanel behavior', () => {
  it('compares values and dispatches each recovery choice', async () => {
    const user = userEvent.setup()
    const onKeep = vi.fn()
    const onReapply = vi.fn()
    const onDismiss = vi.fn()
    render(
      <StaleWritePanel
        stale={staleState()}
        onKeep={onKeep}
        onReapply={onReapply}
        onDismiss={onDismiss}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByText('Theirs')).toBeTruthy()
    expect(screen.getByText('Server name')).toBeTruthy()
    expect(screen.getByText('Yours')).toBeTruthy()
    expect(screen.getByText('My product name')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Keep theirs' }))
    await user.click(screen.getByRole('button', { name: 'Reapply mine' }))
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onKeep).toHaveBeenCalledOnce()
    expect(onReapply).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('shows the fallback conflict copy without audit history', () => {
    render(
      <StaleWritePanel
        stale={{ ...staleState(), change: null }}
        onKeep={vi.fn()}
        onReapply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Someone else saved. Your edit was not applied.'),
    ).toBeTruthy()
    expect(screen.queryByText('Theirs')).toBeNull()
  })
})

describe('product master stale-write behavior', () => {
  it('reapplies the original identity patch with the fresh row version', async () => {
    mocks.callWriteRpc
      .mockResolvedValueOnce({
        ok: false,
        error: { message: 'stale', hint: 'STALE_WRITE' },
      })
      .mockResolvedValueOnce({ ok: true, data: null })
    mocks.fetchProductMaster.mockResolvedValue({ ok: true, data: fresh })
    const { result } = renderHook(() =>
      useProductMasterWrites({
        initial,
        effectiveBrandId: 3,
        canEdit: true,
        isAdmin: false,
      }),
    )

    await act(async () => {
      await result.current.saveIdentity(
        'product_name_display',
        'My product name',
      )
    })
    await waitFor(() => expect(result.current.stale).not.toBeNull())
    expect(mocks.fetchProductMaster).toHaveBeenCalled()

    const conflict = result.current.stale
    expect(conflict?.pendingPatch).toEqual({
      product_name_display: 'My product name',
    })
    await act(async () => {
      const latest = await result.current.refetch()
      if (!latest || !conflict) throw new Error('Expected fresh conflict state')
      result.current.setStale(null)
      await conflict.retry(latest.product.row_version)
    })

    expect(mocks.callWriteRpc).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'update_product_fields',
      {
        p_product_id: 71,
        p_expected_row_version: 10,
        p_patch: { product_name_display: 'My product name' },
      },
    )
    expect(result.current.stale).toBeNull()
  })
})
