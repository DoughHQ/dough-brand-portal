'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { OperatorStudyRow, WithdrawnStudyRow } from '@/lib/studies/types'
import type { StudiesPageCursor } from '@/lib/studies/fetchOperatorStudies'
import { listOperatorStudiesPageAction } from '../listStudiesPageAction'
import type { StudyDraftListItem } from '../drafts/actions'
import type { ToastState } from '../notices/StudiesToast'
import {
  lifecycleOf,
  useStudyListCommands,
  type ConfirmState,
} from './useStudyListCommands'

const COMPLETE_ORDER: Record<string, number> = {
  completed: 0,
  expired: 1,
  archived: 2,
}

function isMultiBrand(args: {
  studies: OperatorStudyRow[]
  withdrawn: WithdrawnStudyRow[]
}): boolean {
  const ids = new Set<number>()
  for (const row of args.studies) {
    if (row.brand_id != null) ids.add(row.brand_id)
  }
  for (const row of args.withdrawn) {
    if (row.brand_id != null) ids.add(row.brand_id)
  }
  return ids.size > 1
}

function sortComplete(a: OperatorStudyRow, b: OperatorStudyRow): number {
  const ao = COMPLETE_ORDER[lifecycleOf(a)] ?? 9
  const bo = COMPLETE_ORDER[lifecycleOf(b)] ?? 9
  if (ao !== bo) return ao - bo
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function sortByCreatedDesc(a: OperatorStudyRow, b: OperatorStudyRow): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export function useStudiesClient({
  initialActive,
  initialActiveHasMore,
  initialActiveCursor,
  initialComplete,
  initialCompleteHasMore,
  initialCompleteCursor,
  withdrawn,
  drafts: initialDrafts,
  loadError = null,
}: {
  initialActive: OperatorStudyRow[]
  initialActiveHasMore: boolean
  initialActiveCursor: StudiesPageCursor | null
  initialComplete: OperatorStudyRow[]
  initialCompleteHasMore: boolean
  initialCompleteCursor: StudiesPageCursor | null
  withdrawn: WithdrawnStudyRow[]
  drafts: StudyDraftListItem[]
  loadError?: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(loadError)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  const [activeRowsState, setActiveRowsState] = useState(initialActive)
  const [activeHasMore, setActiveHasMore] = useState(initialActiveHasMore)
  const [activeCursor, setActiveCursor] = useState(initialActiveCursor)
  const [loadingActiveMore, setLoadingActiveMore] = useState(false)

  const [completeRowsState, setCompleteRowsState] = useState(initialComplete)
  const [completeHasMore, setCompleteHasMore] = useState(initialCompleteHasMore)
  const [completeCursor, setCompleteCursor] = useState(initialCompleteCursor)
  const [loadingCompleteMore, setLoadingCompleteMore] = useState(false)

  const [withdrawnRows, setWithdrawnRows] = useState(withdrawn)
  const [draftRows, setDraftRows] = useState(initialDrafts)

  const studyRows = useMemo(
    () => [...activeRowsState, ...completeRowsState],
    [activeRowsState, completeRowsState]
  )

  useEffect(() => {
    setActiveRowsState(initialActive)
    setActiveHasMore(initialActiveHasMore)
    setActiveCursor(initialActiveCursor)
    setCompleteRowsState(initialComplete)
    setCompleteHasMore(initialCompleteHasMore)
    setCompleteCursor(initialCompleteCursor)
    setWithdrawnRows(withdrawn)
  }, [
    initialActive,
    initialActiveHasMore,
    initialActiveCursor,
    initialComplete,
    initialCompleteHasMore,
    initialCompleteCursor,
    withdrawn,
  ])

  useEffect(() => {
    setDraftRows(initialDrafts)
  }, [initialDrafts])

  useEffect(() => {
    if (!toast) return
    const ms = toast.kind === 'withdraw_undo' ? 6000 : 3500
    const t = setTimeout(() => setToast(null), ms)
    return () => clearTimeout(t)
  }, [toast])

  const showBrand = useMemo(
    () => isMultiBrand({ studies: studyRows, withdrawn: withdrawnRows }),
    [studyRows, withdrawnRows]
  )

  const activeRows = useMemo(() => {
    return activeRowsState.slice().sort(sortByCreatedDesc)
  }, [activeRowsState])

  const completeRows = useMemo(() => {
    return completeRowsState.slice().sort(sortComplete)
  }, [completeRowsState])

  const loadMoreActive = useCallback(async () => {
    if (!activeCursor || loadingActiveMore) return
    setLoadingActiveMore(true)
    const res = await listOperatorStudiesPageAction({ tab: 'active', cursor: activeCursor })
    setLoadingActiveMore(false)
    if (!res.ok) {
      setErrorBanner(res.error)
      return
    }
    setActiveRowsState((prev) => {
      const seen = new Set(prev.map((r) => r.mission_id))
      return [...prev, ...res.rows.filter((r) => !seen.has(r.mission_id))]
    })
    setActiveHasMore(res.hasMore)
    setActiveCursor(res.nextCursor)
  }, [activeCursor, loadingActiveMore])

  const loadMoreComplete = useCallback(async () => {
    if (!completeCursor || loadingCompleteMore) return
    setLoadingCompleteMore(true)
    const res = await listOperatorStudiesPageAction({ tab: 'complete', cursor: completeCursor })
    setLoadingCompleteMore(false)
    if (!res.ok) {
      setErrorBanner(res.error)
      return
    }
    setCompleteRowsState((prev) => {
      const seen = new Set(prev.map((r) => r.mission_id))
      return [...prev, ...res.rows.filter((r) => !seen.has(r.mission_id))]
    })
    setCompleteHasMore(res.hasMore)
    setCompleteCursor(res.nextCursor)
  }, [completeCursor, loadingCompleteMore])

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const {
    executeWithdraw,
    undoWithdraw,
    runRestore,
    executeHardDelete,
    executeCloseStudy,
  } = useStudyListCommands({
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

  const confirmBusy = confirm != null && busyId != null

  return {
    pending,
    busyId,
    toast,
    errorBanner,
    confirm,
    isArchiveOpen,
    setIsArchiveOpen,
    activeHasMore,
    loadingActiveMore,
    completeHasMore,
    loadingCompleteMore,
    withdrawnRows,
    draftRows,
    setDraftRows,
    studyRows,
    showBrand,
    activeRows,
    completeRows,
    loadMoreActive,
    loadMoreComplete,
    undoWithdraw,
    runRestore,
    executeWithdraw,
    executeHardDelete,
    executeCloseStudy,
    setConfirm,
    setErrorBanner,
    setToast,
    confirmBusy,
  }
}
