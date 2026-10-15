'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { BoxTab, OperatorBoxRow, OperatorBoxesPageCursor } from '@/lib/box/operator'
import { listOperatorBoxesAction } from '../actions'
import { parseTab } from './boxesModel'

export function useAdminBoxes({
  initialRows,
  initialHasMore,
  initialCursor,
  initialTab,
  loadError,
}: {
  initialRows: OperatorBoxRow[]
  initialHasMore: boolean
  initialCursor: OperatorBoxesPageCursor | null
  initialTab: BoxTab
  loadError: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<OperatorBoxRow[]>(initialRows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<OperatorBoxesPageCursor | null>(initialCursor)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [error, setError] = useState<string | null>(loadError)
  const [pending, startTransition] = useTransition()
  const [loadingMore, setLoadingMore] = useState(false)
  const loadedKeyRef = useRef(`${initialTab}|false`)

  const activeTab = parseTab(searchParams.get('tab') ?? initialTab)

  const loadTab = useCallback((tab: BoxTab, archived: boolean) => {
    startTransition(async () => {
      const result = await listOperatorBoxesAction({ tab, includeArchived: archived })
      if (result.ok) {
        setRows(result.rows)
        setHasMore(result.hasMore)
        setCursor(result.nextCursor)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }, [])

  useEffect(() => {
    const key = `${activeTab}|${includeArchived}`
    if (key === loadedKeyRef.current) return
    loadedKeyRef.current = key
    loadTab(activeTab, includeArchived)
  }, [activeTab, includeArchived, loadTab])

  function setTab(tab: BoxTab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/admin/boxes?${params.toString()}`)
  }

  function toggleArchived() {
    setIncludeArchived((v) => !v)
  }

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || pending) return
    setLoadingMore(true)
    const result = await listOperatorBoxesAction({
      tab: activeTab,
      includeArchived,
      cursor,
    })
    setLoadingMore(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.box_id))
      return [...prev, ...result.rows.filter((r) => !seen.has(r.box_id))]
    })
    setHasMore(result.hasMore)
    setCursor(result.nextCursor)
  }, [activeTab, cursor, includeArchived, loadingMore, pending])

  return {
    rows,
    hasMore,
    includeArchived,
    error,
    pending,
    loadingMore,
    activeTab,
    setTab,
    toggleArchived,
    loadMore,
  }
}
