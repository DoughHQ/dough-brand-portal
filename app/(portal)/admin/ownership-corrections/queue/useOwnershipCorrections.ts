'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchConglomerateNames,
  type OwnershipCorrectionsPageCursor,
  type PendingOwnershipCorrection,
} from '@/lib/ownershipCorrections'
import {
  listPendingOwnershipCorrectionsAction,
  reviewOwnershipCorrectionAction,
} from '../actions'

export function useOwnershipCorrections({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  initialError,
}: {
  initialRows: PendingOwnershipCorrection[]
  initialHasMore?: boolean
  initialCursor?: OwnershipCorrectionsPageCursor | null
  initialError?: string | null
}) {
  const [rows, setRows] = useState(initialRows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<OwnershipCorrectionsPageCursor | null>(initialCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const [staleConfirmId, setStaleConfirmId] = useState<string | null>(null)
  const [liveNames, setLiveNames] = useState<Map<number, string>>(new Map())

  const staleLiveIds = useMemo(
    () =>
      rows
        .filter((r) => r.snapshot_is_stale && r.live_conglomerate_id != null)
        .map((r) => r.live_conglomerate_id as number),
    [rows]
  )

  useEffect(() => {
    if (staleLiveIds.length === 0) return
    void fetchConglomerateNames(staleLiveIds).then(setLiveNames)
  }, [staleLiveIds])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 4000)
    return () => window.clearTimeout(t)
  }, [flash])

  const refresh = useCallback(async () => {
    const res = await listPendingOwnershipCorrectionsAction()
    if (!res.ok) {
      setError(res.error ?? 'Couldn’t refresh the queue.')
      return
    }
    setRows(res.rows ?? [])
    setHasMore(Boolean(res.hasMore))
    setCursor(res.nextCursor ?? null)
    setError(null)
  }, [])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    const res = await listPendingOwnershipCorrectionsAction({ cursor })
    setLoadingMore(false)
    if (!res.ok) {
      setError(res.error ?? 'Couldn’t load more.')
      return
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.correction_id))
      const merged = [...prev]
      for (const row of res.rows ?? []) {
        if (!seen.has(row.correction_id)) merged.push(row)
      }
      return merged
    })
    setHasMore(Boolean(res.hasMore))
    setCursor(res.nextCursor ?? null)
  }, [cursor, loadingMore])

  const removeRow = useCallback((correctionId: string) => {
    setRows((prev) => prev.filter((r) => r.correction_id !== correctionId))
    setNotesById((prev) => {
      const next = { ...prev }
      delete next[correctionId]
      return next
    })
    setStaleConfirmId((id) => (id === correctionId ? null : id))
  }, [])

  const decide = useCallback(
    async (
      row: PendingOwnershipCorrection,
      decision: 'accept' | 'reject',
      overrideStale: boolean
    ) => {
      setBusyId(row.correction_id)
      setError(null)
      const res = await reviewOwnershipCorrectionAction({
        correctionId: row.correction_id,
        decision,
        reviewNotes: notesById[row.correction_id] ?? null,
        overrideStale,
      })
      setBusyId(null)

      if (!res.ok) {
        if (res.code === 'stale_snapshot') {
          setStaleConfirmId(row.correction_id)
          setError(res.error ?? null)
          return
        }
        if (res.code === 'cannot_review_superseded' || res.code === 'correction_not_found') {
          removeRow(row.correction_id)
          setFlash(res.error ?? 'Removed from queue.')
          if (res.code === 'correction_not_found') void refresh()
          return
        }
        setError(res.error ?? 'Couldn’t complete the review. Try again.')
        return
      }

      removeRow(row.correction_id)
      if (res.result?.idempotent_noop) {
        setFlash('Already reviewed by someone else — removed from queue.')
      } else {
        setFlash(decision === 'accept' ? 'Accepted and applied.' : 'Rejected.')
      }
      setStaleConfirmId(null)
    },
    [notesById, removeRow, refresh]
  )

  function onAcceptClick(row: PendingOwnershipCorrection) {
    if (row.snapshot_is_stale) {
      setStaleConfirmId(row.correction_id)
      setError(null)
      return
    }
    void decide(row, 'accept', false)
  }

  return {
    rows,
    hasMore,
    cursor,
    loadingMore,
    error,
    flash,
    busyId,
    notesById,
    setNotesById,
    staleConfirmId,
    setStaleConfirmId,
    liveNames,
    refresh,
    loadMore,
    decide,
    onAcceptClick,
  }
}
