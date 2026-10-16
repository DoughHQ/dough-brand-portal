// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OperatorStudyRow } from '@/lib/studies/types'

const mocks = vi.hoisted(() => ({
  listOperatorStudiesPageAction: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
vi.mock('../../listStudiesPageAction', () => ({
  listOperatorStudiesPageAction: mocks.listOperatorStudiesPageAction,
}))
vi.mock('../useStudyListCommands', () => ({
  lifecycleOf: (row: OperatorStudyRow) => row.lifecycle_state,
  useStudyListCommands: () => ({
    executeWithdraw: vi.fn(),
    undoWithdraw: vi.fn(),
    runRestore: vi.fn(),
    executeHardDelete: vi.fn(),
    executeEndStudy: vi.fn(),
  }),
}))

import { useStudiesClient } from '../useStudiesClient'

function study(partial: Partial<OperatorStudyRow> = {}): OperatorStudyRow {
  return {
    mission_id: 'm1',
    title: 'Oat carton',
    status: 'active',
    lifecycle_state: 'active',
    is_finished: false,
    brand_id: 4,
    brand_name: 'Maple',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    test_type: 'concept',
    total_claims: 0,
    completed_claims: 0,
    target_completions: 10,
    created_at: '2026-01-01T00:00:00Z',
    expires_at: null,
    ...partial,
  }
}

function renderStudies(overrides: Partial<Parameters<typeof useStudiesClient>[0]> = {}) {
  const args = {
    initialActive: [],
    initialActiveHasMore: false,
    initialActiveCursor: null,
    initialComplete: [],
    initialCompleteHasMore: false,
    initialCompleteCursor: null,
    withdrawn: [],
    drafts: [],
    ...overrides,
  }
  return renderHook(() => useStudiesClient(args))
}

beforeEach(() => {
  mocks.listOperatorStudiesPageAction.mockReset()
  mocks.refresh.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useStudiesClient behavior', () => {
  it('keeps undo toasts for six seconds and plain toasts for 3.5 seconds', async () => {
    vi.useFakeTimers()
    const row = study()
    const { result } = renderStudies()

    act(() => {
      result.current.setToast({
        kind: 'withdraw_undo',
        message: 'Moved to withdrawn',
        missionId: row.mission_id,
        studySnapshot: row,
      })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5999)
    })
    expect(result.current.toast?.kind).toBe('withdraw_undo')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.toast).toBeNull()

    act(() => {
      result.current.setToast({ kind: 'plain', message: 'Saved' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3499)
    })
    expect(result.current.toast).toEqual({ kind: 'plain', message: 'Saved' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.toast).toBeNull()
  })

  it('loads another active page without duplicating an existing mission', async () => {
    const first = study({ mission_id: 'm1', title: 'Original' })
    const second = study({
      mission_id: 'm2',
      title: 'Second',
      created_at: '2026-02-01T00:00:00Z',
    })
    mocks.listOperatorStudiesPageAction.mockResolvedValue({
      ok: true,
      rows: [study({ mission_id: 'm1', title: 'Duplicate' }), second],
      hasMore: false,
      nextCursor: null,
    })
    const cursor = { createdAt: first.created_at, id: first.mission_id }
    const { result } = renderStudies({
      initialActive: [first],
      initialActiveHasMore: true,
      initialActiveCursor: cursor,
    })

    await act(async () => {
      await result.current.loadMoreActive()
    })

    expect(mocks.listOperatorStudiesPageAction).toHaveBeenCalledWith({
      tab: 'active',
      cursor,
    })
    expect(result.current.activeRows.map((row) => row.mission_id)).toEqual([
      'm2',
      'm1',
    ])
    expect(result.current.activeRows.find((row) => row.mission_id === 'm1')?.title).toBe(
      'Original',
    )
    expect(result.current.activeHasMore).toBe(false)
  })

  it('keeps the page and exposes the load-more failure', async () => {
    const first = study()
    mocks.listOperatorStudiesPageAction.mockResolvedValue({
      ok: false,
      error: 'Could not load more studies.',
    })
    const { result } = renderStudies({
      initialActive: [first],
      initialActiveHasMore: true,
      initialActiveCursor: { createdAt: first.created_at, id: first.mission_id },
    })

    await act(async () => {
      await result.current.loadMoreActive()
    })

    expect(result.current.activeRows).toEqual([first])
    expect(result.current.errorBanner).toBe('Could not load more studies.')
    expect(result.current.loadingActiveMore).toBe(false)
  })
})
