// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OperatorStudyRow, WithdrawnStudyRow } from '@/lib/studies/types'
import type { ToastState } from '../../notices/StudiesToast'
import { useStudyListCommands, type ConfirmState } from '../useStudyListCommands'

const {
  withdrawMissionAction,
  restoreMissionAction,
  hardDeleteMissionAction,
  closeStudyAction,
} = vi.hoisted(() => ({
  withdrawMissionAction: vi.fn(),
  restoreMissionAction: vi.fn(),
  hardDeleteMissionAction: vi.fn(),
  closeStudyAction: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('../../missionTrashActions', () => ({
  withdrawMissionAction,
  restoreMissionAction,
  hardDeleteMissionAction,
}))
vi.mock('../../closeStudyAction', () => ({
  closeStudyAction,
}))

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

function withdrawn(partial: Partial<WithdrawnStudyRow> = {}): WithdrawnStudyRow {
  return {
    mission_id: 'gone',
    title: 'Pulled study',
    status: 'withdrawn',
    is_draft: false,
    brand_id: 4,
    brand_name: 'Maple',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    total_claims: 0,
    completed_claims: 0,
    created_at: '2026-03-01T00:00:00Z',
    deleted_at: '2026-03-02T00:00:00Z',
    ...partial,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function useHarness({
  active = [],
  complete = [],
  withdrawnRows = [],
  toast: initialToast = null,
  confirm: initialConfirm = null,
}: {
  active?: OperatorStudyRow[]
  complete?: OperatorStudyRow[]
  withdrawnRows?: WithdrawnStudyRow[]
  toast?: ToastState | null
  confirm?: ConfirmState
} = {}) {
  const [activeRows, setActiveRowsState] = useState(active)
  const [completeRows, setCompleteRowsState] = useState(complete)
  const [archiveRows, setWithdrawnRows] = useState(withdrawnRows)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>('old error')
  const [confirm, setConfirm] = useState<ConfirmState>(initialConfirm)
  const [toast, setToast] = useState<ToastState | null>(initialToast)
  const [refresh] = useState(() => vi.fn())
  const commands = useStudyListCommands({
    toast,
    refresh,
    setBusyId,
    setErrorBanner,
    setConfirm,
    setActiveRowsState,
    setCompleteRowsState,
    setWithdrawnRows,
    setToast,
  })
  return {
    activeRows,
    completeRows,
    archiveRows,
    busyId,
    errorBanner,
    confirm,
    toast,
    refresh,
    ...commands,
  }
}

describe('useStudyListCommands', () => {
  beforeEach(() => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-04-02T15:00:00.000Z')
    withdrawMissionAction.mockReset()
    restoreMissionAction.mockReset()
    hardDeleteMissionAction.mockReset()
    closeStudyAction.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('moves a withdrawn study to the front of the archive and offers undo', async () => {
    const row = study()
    const pending = deferred<{ ok: true }>()
    withdrawMissionAction.mockReturnValue(pending.promise)
    const { result } = renderHook(() =>
      useHarness({
        active: [row, study({ mission_id: 'keep', title: 'Keep' })],
        complete: [study({ mission_id: 'm1', title: 'Stale complete' })],
        withdrawnRows: [withdrawn({ mission_id: 'm1', title: 'Old copy' }), withdrawn()],
        confirm: { kind: 'close', row },
      }),
    )

    let done!: Promise<void>
    act(() => {
      done = result.current.executeWithdraw(row)
    })
    expect(result.current.busyId).toBe('m1')
    expect(result.current.confirm).toEqual({ kind: 'close', row })

    await act(async () => {
      pending.resolve({ ok: true })
      await done
    })

    expect(result.current.busyId).toBeNull()
    expect(result.current.confirm).toBeNull()
    expect(result.current.errorBanner).toBeNull()
    expect(result.current.activeRows.map((item) => item.mission_id)).toEqual(['keep'])
    expect(result.current.completeRows).toEqual([])
    expect(result.current.archiveRows.map((item) => item.title)).toEqual([
      'Oat carton',
      'Pulled study',
    ])
    expect(result.current.archiveRows[0]).toMatchObject({
      mission_id: 'm1',
      status: 'active',
      is_draft: false,
      brand_name: 'Maple',
      deleted_at: '2026-04-02T15:00:00.000Z',
    })
    expect(result.current.toast).toEqual({
      kind: 'withdraw_undo',
      message: 'Moved to withdrawn',
      missionId: 'm1',
      studySnapshot: row,
    })
    expect(result.current.refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the lists when withdraw fails and still closes the confirm', async () => {
    const row = study()
    withdrawMissionAction.mockResolvedValue({ ok: false, error: 'Nope' })
    const { result } = renderHook(() =>
      useHarness({
        active: [row],
        confirm: { kind: 'close', row },
      }),
    )

    await act(async () => {
      await result.current.executeWithdraw(row)
    })

    expect(result.current.errorBanner).toBe('Nope')
    expect(result.current.confirm).toBeNull()
    expect(result.current.activeRows).toEqual([row])
    expect(result.current.toast).toBeNull()
    expect(result.current.refresh).not.toHaveBeenCalled()
  })

  it('returns a completed study to complete and any other study to active', async () => {
    const completed = study({
      mission_id: 'done',
      title: 'Done',
      status: 'completed',
      lifecycle_state: 'completed',
      is_finished: true,
    })
    const active = study({ mission_id: 'live', title: 'Live' })
    restoreMissionAction.mockResolvedValue({ ok: true })

    const completedHook = renderHook(() =>
      useHarness({
        withdrawnRows: [withdrawn({ mission_id: 'done' }), withdrawn({ mission_id: 'stay' })],
        toast: {
          kind: 'withdraw_undo',
          message: 'Moved to withdrawn',
          missionId: 'done',
          studySnapshot: completed,
        },
      }),
    )
    await act(async () => {
      await completedHook.result.current.undoWithdraw()
    })
    expect(completedHook.result.current.completeRows).toEqual([completed])
    expect(completedHook.result.current.activeRows).toEqual([])
    expect(completedHook.result.current.archiveRows.map((item) => item.mission_id)).toEqual(['stay'])
    expect(completedHook.result.current.toast).toEqual({ kind: 'plain', message: 'Restored' })

    const activeHook = renderHook(() =>
      useHarness({
        withdrawnRows: [withdrawn({ mission_id: 'live' })],
        toast: {
          kind: 'withdraw_undo',
          message: 'Moved to withdrawn',
          missionId: 'live',
          studySnapshot: active,
        },
      }),
    )
    await act(async () => {
      await activeHook.result.current.undoWithdraw()
    })
    expect(activeHook.result.current.activeRows).toEqual([active])
    expect(activeHook.result.current.completeRows).toEqual([])
    expect(activeHook.result.current.archiveRows).toEqual([])
  })

  it('ignores undo when the toast cannot undo', async () => {
    const { result } = renderHook(() =>
      useHarness({ toast: { kind: 'plain', message: 'Saved' } }),
    )

    await act(async () => {
      await result.current.undoWithdraw()
    })

    expect(restoreMissionAction).not.toHaveBeenCalled()
    expect(result.current.toast).toEqual({ kind: 'plain', message: 'Saved' })
  })

  it('restores an archived study with the server message', async () => {
    restoreMissionAction.mockResolvedValue({ ok: true, message: 'Back on the list' })
    const { result } = renderHook(() =>
      useHarness({
        withdrawnRows: [withdrawn({ mission_id: 'gone' }), withdrawn({ mission_id: 'stay' })],
      }),
    )

    await act(async () => {
      await result.current.runRestore('gone')
    })

    expect(result.current.archiveRows.map((item) => item.mission_id)).toEqual(['stay'])
    expect(result.current.toast).toEqual({ kind: 'plain', message: 'Back on the list' })
    expect(result.current.refresh).toHaveBeenCalledTimes(1)
  })

  it('uses Restored when the server omits a restore message', async () => {
    restoreMissionAction.mockResolvedValue({ ok: false, error: 'Still withdrawn' })
    const failed = renderHook(() =>
      useHarness({ withdrawnRows: [withdrawn()] }),
    )
    await act(async () => {
      await failed.result.current.runRestore('gone')
    })
    expect(failed.result.current.errorBanner).toBe('Still withdrawn')
    expect(failed.result.current.archiveRows).toHaveLength(1)
    expect(failed.result.current.toast).toBeNull()
    expect(failed.result.current.refresh).not.toHaveBeenCalled()

    restoreMissionAction.mockResolvedValue({ ok: true })
    const restored = renderHook(() =>
      useHarness({ withdrawnRows: [withdrawn()] }),
    )
    await act(async () => {
      await restored.result.current.runRestore('gone')
    })
    expect(restored.result.current.toast).toEqual({ kind: 'plain', message: 'Restored' })
    expect(restored.result.current.archiveRows).toEqual([])
  })

  it('permanently deletes an archived study', async () => {
    hardDeleteMissionAction.mockResolvedValue({ ok: true, message: 'Removed' })
    const row = withdrawn()
    const named = renderHook(() =>
      useHarness({
        withdrawnRows: [row, withdrawn({ mission_id: 'stay' })],
        confirm: { kind: 'hard_delete', row },
      }),
    )
    await act(async () => {
      await named.result.current.executeHardDelete(row)
    })
    expect(named.result.current.archiveRows.map((item) => item.mission_id)).toEqual(['stay'])
    expect(named.result.current.confirm).toBeNull()
    expect(named.result.current.toast).toEqual({ kind: 'plain', message: 'Removed' })

    hardDeleteMissionAction.mockResolvedValue({ ok: true })
    const fallback = renderHook(() => useHarness({ withdrawnRows: [row] }))
    await act(async () => {
      await fallback.result.current.executeHardDelete(row)
    })
    expect(fallback.result.current.toast).toEqual({
      kind: 'plain',
      message: 'Permanently deleted',
    })
    expect(fallback.result.current.archiveRows).toEqual([])
  })

  it('closes a study into the completed list', async () => {
    const row = study({ mission_id: 'live', title: 'Live' })
    closeStudyAction.mockResolvedValue({
      ok: true,
      message: 'Closed',
      inFlightStopped: 0,
      wasAlready: false,
    })
    const { result } = renderHook(() =>
      useHarness({
        active: [row, study({ mission_id: 'keep', title: 'Keep' })],
        complete: [study({ mission_id: 'live', title: 'Stale' })],
        confirm: { kind: 'close', row },
      }),
    )

    await act(async () => {
      await result.current.executeCloseStudy(row)
    })

    expect(result.current.activeRows.map((item) => item.mission_id)).toEqual(['keep'])
    expect(result.current.completeRows).toEqual([
      {
        ...row,
        is_finished: true,
        status: 'completed',
        lifecycle_state: 'completed',
      },
    ])
    expect(result.current.confirm).toBeNull()
    expect(result.current.toast).toEqual({ kind: 'plain', message: 'Moved to Complete' })
    expect(result.current.refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the study when close fails', async () => {
    const row = study()
    closeStudyAction.mockResolvedValue({ ok: false, error: 'Not runnable' })
    const { result } = renderHook(() =>
      useHarness({
        active: [row],
        confirm: { kind: 'close', row },
      }),
    )

    await act(async () => {
      await result.current.executeCloseStudy(row)
    })

    expect(result.current.errorBanner).toBe('Not runnable')
    expect(result.current.confirm).toBeNull()
    expect(result.current.activeRows).toEqual([row])
    expect(result.current.completeRows).toEqual([])
    expect(result.current.toast).toBeNull()
    expect(result.current.refresh).not.toHaveBeenCalled()
  })
})
