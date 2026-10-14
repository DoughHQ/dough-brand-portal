// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PendingOwnershipCorrection } from '@/lib/ownershipCorrections'
import { useOwnershipCorrections } from '../useOwnershipCorrections'

const { listPendingOwnershipCorrectionsAction, reviewOwnershipCorrectionAction } = vi.hoisted(() => ({
  listPendingOwnershipCorrectionsAction: vi.fn(),
  reviewOwnershipCorrectionAction: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('../../actions', () => ({
  listPendingOwnershipCorrectionsAction,
  reviewOwnershipCorrectionAction,
}))
vi.mock('@/lib/ownershipCorrections', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownershipCorrections')>(
    '@/lib/ownershipCorrections',
  )
  return {
    ...actual,
    fetchConglomerateNames: vi.fn(async () => new Map()),
  }
})

function row(id: string, overrides: Partial<PendingOwnershipCorrection> = {}): PendingOwnershipCorrection {
  return {
    correction_id: id,
    brand_id: 42,
    brand_name: 'Oatly',
    assertion_type: 'has_parent',
    asserted_conglomerate_id: 9,
    asserted_display_name: 'Big Co',
    current_conglomerate_id: 3,
    current_display_name: 'Acme',
    snapshot_is_stale: false,
    live_conglomerate_id: null,
    user_notes: null,
    evidence_url: null,
    submitted_by_portal_user_id: null,
    submitted_at: '2026-10-11T12:00:00.000Z',
    ...overrides,
  }
}

describe('useOwnershipCorrections', () => {
  beforeEach(() => {
    listPendingOwnershipCorrectionsAction.mockReset()
    reviewOwnershipCorrectionAction.mockReset()
  })

  it('accepts a fresh correction and removes it', async () => {
    reviewOwnershipCorrectionAction.mockResolvedValue({
      ok: true,
      result: { status: 'accepted', idempotent_noop: false },
    })
    const { result } = renderHook(() =>
      useOwnershipCorrections({ initialRows: [row('c1')] }),
    )
    await act(async () => {
      await result.current.decide(row('c1'), 'accept', false)
    })
    expect(result.current.rows).toEqual([])
    expect(result.current.flash).toBe('Accepted and applied.')
    expect(reviewOwnershipCorrectionAction).toHaveBeenCalledWith({
      correctionId: 'c1',
      decision: 'accept',
      reviewNotes: null,
      overrideStale: false,
    })
  })

  it('keeps a stale snapshot open for confirmation', async () => {
    reviewOwnershipCorrectionAction.mockResolvedValue({
      ok: false,
      code: 'stale_snapshot',
      error: 'The parent changed since submission — re-verify and confirm to apply.',
    })
    const stale = row('c1', { snapshot_is_stale: true })
    const { result } = renderHook(() => useOwnershipCorrections({ initialRows: [stale] }))
    await act(async () => {
      result.current.onAcceptClick(stale)
    })
    expect(reviewOwnershipCorrectionAction).not.toHaveBeenCalled()
    expect(result.current.staleConfirmId).toBe('c1')

    await act(async () => {
      await result.current.decide(stale, 'accept', true)
    })
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.error).toBe(
      'The parent changed since submission — re-verify and confirm to apply.',
    )
  })

  it('drops a missing correction and says when someone else already reviewed it', async () => {
    reviewOwnershipCorrectionAction.mockResolvedValueOnce({
      ok: false,
      code: 'correction_not_found',
      error: 'Gone',
    })
    listPendingOwnershipCorrectionsAction.mockResolvedValue({ ok: true, rows: [], hasMore: false })
    const { result } = renderHook(() =>
      useOwnershipCorrections({ initialRows: [row('c1'), row('c2')] }),
    )
    await act(async () => {
      await result.current.decide(row('c1'), 'reject', false)
    })
    expect(result.current.rows).toEqual([])
    expect(result.current.flash).toBe('Gone')
    expect(listPendingOwnershipCorrectionsAction).toHaveBeenCalledWith()
  })

  it('says when someone else already reviewed the correction', async () => {
    reviewOwnershipCorrectionAction.mockResolvedValue({
      ok: true,
      result: { status: 'rejected', idempotent_noop: true },
    })
    const { result } = renderHook(() => useOwnershipCorrections({ initialRows: [row('c2')] }))
    await act(async () => {
      await result.current.decide(row('c2'), 'reject', false)
    })
    expect(result.current.flash).toBe('Already reviewed by someone else — removed from queue.')
    expect(result.current.rows).toEqual([])
  })

  it('appends unseen rows and reports a failed refresh', async () => {
    const cursor = { submittedAt: '2026-10-11T12:00:00.000Z', id: 'c1' }
    listPendingOwnershipCorrectionsAction.mockResolvedValueOnce({
      ok: true,
      rows: [row('c1'), row('c2')],
      hasMore: false,
      nextCursor: null,
    })
    const { result } = renderHook(() =>
      useOwnershipCorrections({
        initialRows: [row('c1')],
        initialHasMore: true,
        initialCursor: cursor,
      }),
    )
    await act(async () => {
      await result.current.loadMore()
    })
    expect(result.current.rows.map((entry) => entry.correction_id)).toEqual(['c1', 'c2'])
    expect(result.current.hasMore).toBe(false)
    expect(listPendingOwnershipCorrectionsAction).toHaveBeenCalledWith({ cursor })

    listPendingOwnershipCorrectionsAction.mockResolvedValueOnce({ ok: false })
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.error).toBe('Couldn’t refresh the queue.')
  })
})
