'use client'

import { useCallback, type Dispatch, type SetStateAction } from 'react'
import type { OperatorStudyLifecycleState, OperatorStudyRow, WithdrawnStudyRow } from '@/lib/studies/types'
import {
  hardDeleteMissionAction,
  restoreMissionAction,
  withdrawMissionAction,
} from '../missionTrashActions'
import { closeStudyAction } from '../closeStudyAction'
import type { ToastState } from '../notices/StudiesToast'

export function lifecycleOf(row: OperatorStudyRow): OperatorStudyLifecycleState {
  return row.lifecycle_state
}

function isCompleteBucket(state: OperatorStudyLifecycleState): boolean {
  return state === 'completed' || state === 'expired' || state === 'archived'
}

function isDraftBucket(state: OperatorStudyLifecycleState): boolean {
  return state === 'draft'
}

/** Same buckets the Active/Complete tabs used. Draft operator rows stay hidden; in_review is Active. */
function bucketForRow(row: OperatorStudyRow): 'active' | 'complete' | null {
  const state = lifecycleOf(row)
  if (isDraftBucket(state)) return null
  if (isCompleteBucket(state)) return 'complete'
  return 'active'
}

function withdrawnFromStudy(row: OperatorStudyRow): WithdrawnStudyRow {
  return {
    mission_id: row.mission_id,
    title: row.title,
    status: row.status,
    is_draft: lifecycleOf(row) === 'draft',
    brand_id: row.brand_id,
    brand_name: row.brand_name,
    focal_product_id: row.focal_product_id,
    focal_product_name: row.focal_product_name,
    template_code: row.template_code,
    total_claims: row.total_claims,
    completed_claims: row.completed_claims,
    created_at: row.created_at,
    deleted_at: new Date().toISOString(),
  }
}

export type ConfirmState =
  | null
  | { kind: 'close'; row: OperatorStudyRow }
  | { kind: 'hard_delete'; row: WithdrawnStudyRow }

export function useStudyListCommands({
  toast,
  refresh,
  setBusyId,
  setErrorBanner,
  setConfirm,
  setActiveRowsState,
  setCompleteRowsState,
  setWithdrawnRows,
  setToast,
}: {
  toast: ToastState | null
  refresh: () => void
  setBusyId: Dispatch<SetStateAction<string | null>>
  setErrorBanner: Dispatch<SetStateAction<string | null>>
  setConfirm: Dispatch<SetStateAction<ConfirmState>>
  setActiveRowsState: Dispatch<SetStateAction<OperatorStudyRow[]>>
  setCompleteRowsState: Dispatch<SetStateAction<OperatorStudyRow[]>>
  setWithdrawnRows: Dispatch<SetStateAction<WithdrawnStudyRow[]>>
  setToast: Dispatch<SetStateAction<ToastState | null>>
}) {
  const executeWithdraw = useCallback(
    async (row: OperatorStudyRow) => {
      setBusyId(row.mission_id)
      setErrorBanner(null)
      const result = await withdrawMissionAction(row.mission_id)
      setBusyId(null)
      setConfirm(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      setActiveRowsState((rows) => rows.filter((r) => r.mission_id !== row.mission_id))
      setCompleteRowsState((rows) => rows.filter((r) => r.mission_id !== row.mission_id))
      setWithdrawnRows((rows) => [
        withdrawnFromStudy(row),
        ...rows.filter((r) => r.mission_id !== row.mission_id),
      ])
      setToast({
        kind: 'withdraw_undo',
        message: 'Moved to withdrawn',
        missionId: row.mission_id,
        studySnapshot: row,
      })
      refresh()
    },
    [
      refresh,
      setBusyId,
      setErrorBanner,
      setConfirm,
      setActiveRowsState,
      setCompleteRowsState,
      setWithdrawnRows,
      setToast,
    ]
  )

  const undoWithdraw = useCallback(async () => {
    if (!toast || toast.kind !== 'withdraw_undo') return
    const pendingUndo = toast
    setBusyId(pendingUndo.missionId)
    setErrorBanner(null)
    const result = await restoreMissionAction(pendingUndo.missionId)
    setBusyId(null)
    if (!result.ok) {
      setErrorBanner(result.error)
      return
    }
    setWithdrawnRows((rows) => rows.filter((r) => r.mission_id !== pendingUndo.missionId))
    const snap = pendingUndo.studySnapshot
    if (bucketForRow(snap) === 'complete') {
      setCompleteRowsState((rows) => [snap, ...rows])
    } else {
      setActiveRowsState((rows) => [snap, ...rows])
    }
    setToast({ kind: 'plain', message: 'Restored' })
    refresh()
  }, [
    toast,
    refresh,
    setBusyId,
    setErrorBanner,
    setWithdrawnRows,
    setCompleteRowsState,
    setActiveRowsState,
    setToast,
  ])

  const runRestore = useCallback(
    async (missionId: string) => {
      setBusyId(missionId)
      setErrorBanner(null)
      const result = await restoreMissionAction(missionId)
      setBusyId(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      setWithdrawnRows((rows) => rows.filter((r) => r.mission_id !== missionId))
      setToast({ kind: 'plain', message: result.message ?? 'Restored' })
      refresh()
    },
    [refresh, setBusyId, setErrorBanner, setWithdrawnRows, setToast]
  )

  const executeHardDelete = useCallback(
    async (row: WithdrawnStudyRow) => {
      setBusyId(row.mission_id)
      setErrorBanner(null)
      const result = await hardDeleteMissionAction(row.mission_id)
      setBusyId(null)
      setConfirm(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      setWithdrawnRows((rows) => rows.filter((r) => r.mission_id !== row.mission_id))
      setToast({ kind: 'plain', message: result.message ?? 'Permanently deleted' })
      refresh()
    },
    [refresh, setBusyId, setErrorBanner, setConfirm, setWithdrawnRows, setToast]
  )

  const executeCloseStudy = useCallback(
    async (row: OperatorStudyRow) => {
      setBusyId(row.mission_id)
      setErrorBanner(null)
      const result = await closeStudyAction(row.mission_id)
      setBusyId(null)
      setConfirm(null)
      if (!result.ok) {
        setErrorBanner(result.error)
        return
      }
      const closed: OperatorStudyRow = {
        ...row,
        is_finished: true,
        status: 'completed',
        lifecycle_state: 'completed',
      }
      setActiveRowsState((rows) => rows.filter((r) => r.mission_id !== row.mission_id))
      setCompleteRowsState((rows) => [
        closed,
        ...rows.filter((r) => r.mission_id !== row.mission_id),
      ])
      setToast({ kind: 'plain', message: 'Moved to Complete' })
      refresh()
    },
    [
      refresh,
      setBusyId,
      setErrorBanner,
      setConfirm,
      setActiveRowsState,
      setCompleteRowsState,
      setToast,
    ]
  )

  return {
    executeWithdraw,
    undoWithdraw,
    runRestore,
    executeHardDelete,
    executeCloseStudy,
  }
}
