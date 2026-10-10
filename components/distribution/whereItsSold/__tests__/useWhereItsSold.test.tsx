// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useWhereItsSold from '../useWhereItsSold'
import { report, row } from './fixtures'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  fetchCanDeclare: vi.fn(),
  fetchDistribution: vi.fn(),
  fetchPendingReports: vi.fn(),
  declareAvailability: vi.fn(),
  reviewCoordinate: vi.fn(),
  withdrawDeclaration: vi.fn(),
  delistDeclaration: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/distribution/api', () => ({
  fetchCanDeclare: mocks.fetchCanDeclare,
  fetchDistribution: mocks.fetchDistribution,
  fetchPendingReports: mocks.fetchPendingReports,
  declareAvailability: mocks.declareAvailability,
  reviewCoordinate: mocks.reviewCoordinate,
  withdrawDeclaration: mocks.withdrawDeclaration,
  delistDeclaration: mocks.delistDeclaration,
}))

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  mocks.createClient.mockReturnValue({ client: true })
  mocks.fetchCanDeclare.mockResolvedValue({
    capability: { allowed: true, reason: null, reasonMessage: null },
    error: null,
  })
  mocks.fetchDistribution.mockResolvedValue({ rows: [], error: null })
  mocks.fetchPendingReports.mockResolvedValue({ reports: [], error: null })
  mocks.declareAvailability.mockResolvedValue({
    declarationId: 101,
    error: null,
  })
  mocks.reviewCoordinate.mockResolvedValue({
    result: { reportsAffected: 1 },
    error: null,
  })
  mocks.withdrawDeclaration.mockResolvedValue({ ok: true, error: null })
  mocks.delistDeclaration.mockResolvedValue({ ok: true, error: null })
})

async function renderLoadedHook() {
  const rendered = renderHook(() => useWhereItsSold(42, null))
  await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  return rendered
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('useWhereItsSold loading and declarations', () => {
  it('stops after capability refusal without loading rows or reports', async () => {
    mocks.fetchCanDeclare.mockResolvedValue({
      capability: {
        allowed: false,
        reason: 'not_owner',
        reasonMessage: 'Ownership required.',
      },
      error: null,
    })

    const { result } = await renderLoadedHook()

    expect(result.current.capability?.allowed).toBe(false)
    expect(result.current.rows).toEqual([])
    expect(mocks.fetchDistribution).not.toHaveBeenCalled()
    expect(mocks.fetchPendingReports).not.toHaveBeenCalled()
  })

  it('surfaces capability errors and clears capability data', async () => {
    mocks.fetchCanDeclare.mockResolvedValue({
      capability: { allowed: false, reason: null, reasonMessage: null },
      error: 'Capability failed',
    })

    const { result } = await renderLoadedHook()

    expect(result.current.capability).toBeNull()
    expect(result.current.error).toBe('Capability failed')
    expect(mocks.fetchDistribution).not.toHaveBeenCalled()
  })

  it('ignores a stale load after the product changes', async () => {
    const firstCapability = deferred<{
      capability: { allowed: boolean; reason: null; reasonMessage: null }
      error: null
    }>()
    mocks.fetchCanDeclare
      .mockReturnValueOnce(firstCapability.promise)
      .mockResolvedValueOnce({
        capability: { allowed: true, reason: null, reasonMessage: null },
        error: null,
      })
    mocks.fetchDistribution.mockResolvedValue({
      rows: [row({ retailer_id: 42, retailer_name: 'Current product' })],
      error: null,
    })
    const rendered = renderHook(
      ({ productId }) => useWhereItsSold(productId, null),
      { initialProps: { productId: 41 } },
    )

    rendered.rerender({ productId: 42 })
    await waitFor(() => expect(rendered.result.current.loading).toBe(false))
    firstCapability.resolve({
      capability: { allowed: true, reason: null, reasonMessage: null },
      error: null,
    })
    await act(async () => {
      await firstCapability.promise
    })

    expect(rendered.result.current.rows[0]?.retailer_name).toBe(
      'Current product',
    )
    expect(mocks.fetchDistribution).toHaveBeenCalledTimes(1)
    expect(mocks.fetchDistribution).toHaveBeenCalledWith(
      { client: true },
      42,
    )
  })

  it('hides prior product permissions and filters during a transition', async () => {
    mocks.fetchDistribution.mockResolvedValueOnce({
      rows: [row({ retailer_name: 'Previous product' })],
      error: null,
    })
    const rendered = renderHook(
      ({ productId }) => useWhereItsSold(productId, null),
      { initialProps: { productId: 41 } },
    )
    await waitFor(() => expect(rendered.result.current.loading).toBe(false))
    act(() => rendered.result.current.setBannerQuery('previous'))

    const nextCapability = deferred<{
      capability: {
        allowed: false
        reason: 'not_owner'
        reasonMessage: string
      }
      error: null
    }>()
    mocks.fetchCanDeclare.mockReturnValueOnce(nextCapability.promise)
    rendered.rerender({ productId: 42 })

    expect(rendered.result.current.loading).toBe(true)
    expect(rendered.result.current.capability).toBeNull()
    expect(rendered.result.current.rows).toEqual([])
    await waitFor(() => expect(rendered.result.current.bannerQuery).toBe(''))

    nextCapability.resolve({
      capability: {
        allowed: false,
        reason: 'not_owner',
        reasonMessage: 'Ownership required.',
      },
      error: null,
    })
    await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  })

  it('declares regional and gates national claims behind confirmation', async () => {
    const regional = row()
    const national = row({
      retailer_id: 8,
      retailer_name: 'Whole Foods',
      scope_level: 'national',
      geo_region_id: null,
      scope_label: 'Nationwide',
      sku_variant_id: 3,
    })
    const { result } = await renderLoadedHook()

    await act(async () => {
      await result.current.runDeclare({
        retailerId: regional.retailer_id,
        scopeLevel: 'region',
        geoRegionId: regional.geo_region_id,
        skuVariantId: null,
      })
    })
    expect(mocks.declareAvailability).toHaveBeenLastCalledWith(
      { client: true },
      {
        productId: 42,
        retailerId: 7,
        scopeLevel: 'region',
        geoRegionId: 11,
        skuVariantId: null,
        notes: null,
      },
    )

    act(() => {
      result.current.cardHandlers.onClaim(national)
    })
    expect(result.current.modal).toEqual({
      kind: 'nationwide-confirm',
      returnToAdd: false,
      pending: {
        retailerId: 8,
        scopeLevel: 'national',
        geoRegionId: null,
        skuVariantId: 3,
      },
    })
    expect(mocks.declareAvailability).toHaveBeenCalledTimes(1)

    const nationwideModal = result.current.modal
    if (nationwideModal?.kind !== 'nationwide-confirm') {
      throw new Error('Expected nationwide confirmation')
    }
    await act(async () => {
      await result.current.runDeclare(nationwideModal.pending)
    })
    expect(mocks.declareAvailability).toHaveBeenLastCalledWith(
      { client: true },
      expect.objectContaining({
        productId: 42,
        retailerId: 8,
        scopeLevel: 'national',
        geoRegionId: null,
        skuVariantId: 3,
      }),
    )
  })

  it('declares a correction before reviewing its original coordinate', async () => {
    const { result } = await renderLoadedHook()

    await act(async () => {
      await result.current.runDeclare({
        retailerId: 12,
        scopeLevel: 'region',
        geoRegionId: 13,
        skuVariantId: 4,
        afterCorrectCoord: {
          retailer_id: 7,
          scope_level: 'region',
          geo_region_id: 11,
          retail_location_id: null,
          sku_variant_id: null,
        },
        afterCorrectNote: 'Wrong region',
      })
    })

    expect(mocks.declareAvailability).toHaveBeenCalledBefore(
      mocks.reviewCoordinate,
    )
    expect(mocks.reviewCoordinate).toHaveBeenCalledWith(
      { client: true },
      {
        productId: 42,
        retailerId: 7,
        scopeLevel: 'region',
        action: 'correct',
        geoRegionId: 11,
        retailLocationId: null,
        skuVariantId: null,
        note: 'Wrong region',
      },
    )
    expect(result.current.toast).toBe(
      'Correction saved — original sightings stay on file as contested.',
    )
  })

  it('validates a correction before creating its replacement declaration', async () => {
    const { result } = await renderLoadedHook()

    await act(async () => {
      await result.current.runDeclare({
        retailerId: 12,
        scopeLevel: 'region',
        geoRegionId: 13,
        skuVariantId: null,
        afterCorrectCoord: {
          retailer_id: 7,
          scope_level: 'region',
          geo_region_id: 11,
          retail_location_id: null,
          sku_variant_id: null,
        },
      })
    })

    expect(result.current.error).toBe(
      'Add a short note explaining the correction.',
    )
    expect(mocks.declareAvailability).not.toHaveBeenCalled()
    expect(mocks.reviewCoordinate).not.toHaveBeenCalled()
  })
})

describe('useWhereItsSold review and lifecycle orchestration', () => {
  it('confirms all reports at a coordinate and reloads', async () => {
    const target = row({
      awaiting_review: 1,
      needs_attention: true,
      shopper_reports: 1,
    })
    const pending = [report()]
    const { result } = await renderLoadedHook()

    act(() => {
      result.current.cardHandlers.onConfirm(target, pending)
    })

    await waitFor(() =>
      expect(result.current.toast).toBe(
        'Confirmed — added Market Basket · Massachusetts to your distribution.',
      ),
    )
    expect(mocks.reviewCoordinate).toHaveBeenCalledWith(
      { client: true },
      expect.objectContaining({
        productId: 42,
        action: 'confirm',
        retailerId: 7,
        geoRegionId: 11,
      }),
    )
    expect(mocks.fetchCanDeclare).toHaveBeenCalledTimes(2)
  })

  it('withdraws an existing declaration', async () => {
    const target = row({
      declaration_id: 55,
      brand_status: 'active',
      dough_seeded: false,
    })
    const { result } = await renderLoadedHook()

    act(() => {
      result.current.cardHandlers.onWithdraw(target)
    })

    await waitFor(() =>
      expect(result.current.toast).toBe(
        'You withdrew Market Basket · Massachusetts.',
      ),
    )
    expect(mocks.withdrawDeclaration).toHaveBeenCalledWith(
      { client: true },
      55,
    )
  })

  it('retains partial claim-all success and reports failures', async () => {
    const seeds = [
      row(),
      row({
        retailer_id: 8,
        retailer_name: 'Whole Foods',
        scope_level: 'national',
        geo_region_id: null,
        scope_label: 'Nationwide',
      }),
      row({
        retailer_id: 9,
        retailer_name: 'Target',
        geo_region_id: 14,
        scope_label: 'New York',
      }),
    ]
    mocks.declareAvailability
      .mockResolvedValueOnce({ declarationId: 1, error: null })
      .mockResolvedValueOnce({ declarationId: null, error: 'Denied' })
      .mockResolvedValueOnce({ declarationId: 3, error: null })
    const { result } = await renderLoadedHook()

    await act(async () => {
      await result.current.onClaimAll(seeds)
    })

    expect(mocks.declareAvailability).toHaveBeenCalledTimes(3)
    expect(mocks.declareAvailability.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        retailerId: 8,
        scopeLevel: 'national',
        geoRegionId: null,
      }),
    )
    expect(result.current.toast).toBe('Claimed 2 of 3. 1 failed.')
    expect(result.current.error).toBe('Whole Foods: Denied')
    expect(result.current.modal).toBeNull()
  })

  it('delists and disputes with the original API contracts', async () => {
    mocks.reviewCoordinate.mockResolvedValue({
      result: { reportsAffected: 2 },
      error: null,
    })
    const { result } = await renderLoadedHook()
    const coord = {
      retailer_id: 7,
      scope_level: 'region',
      geo_region_id: 11,
      retail_location_id: null,
      sku_variant_id: null,
    }

    await act(async () => {
      await result.current.onDelist(55, '2026-10-03')
    })
    expect(mocks.delistDeclaration).toHaveBeenCalledWith(
      { client: true },
      55,
      '2026-10-03',
    )
    expect(result.current.toast).toBe('Marked delisted as of 3 Oct 2026.')

    await act(async () => {
      await result.current.onDispute(coord, 'Not carried here')
    })
    expect(mocks.reviewCoordinate).toHaveBeenCalledWith(
      { client: true },
      {
        productId: 42,
        retailerId: 7,
        scopeLevel: 'region',
        action: 'dispute',
        geoRegionId: 11,
        retailLocationId: null,
        skuVariantId: null,
        note: 'Not carried here',
      },
    )
    expect(result.current.toast).toBe(
      'Disputed 2 reports — escalated to Dough. Sightings stay visible.',
    )
  })
})
