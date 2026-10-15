'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { CorrectionReviewRow, CorrectionReviewsPageCursor } from '@/lib/corrections.shared'
import {
  BRAND_FOCUS_COPY,
  initialFocusIndex,
  missingFocusNotice,
  relatedClaims,
  replaceBrandCursor,
} from '@/lib/correctionsDesk'
import {
  listRelatedBrandCorrectionsAction,
  loadMoreBrandCorrectionsAction,
} from '../actions'
import { queueReducer, waitingLabel } from './brandQueue'

export function useBrandCorrections({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  pendingCount = 0,
  focusId = null,
  renderedAt,
}: {
  initialRows: CorrectionReviewRow[]
  initialHasMore?: boolean
  initialCursor?: CorrectionReviewsPageCursor | null
  pendingCount?: number
  focusId?: string | null
  renderedAt?: number
}) {
const nowMs = renderedAt ?? 0
const [queue, dispatch] = useReducer(queueReducer, {
  rows: initialRows,
  focusIndex: initialFocusIndex(initialRows, focusId),
})
const [hasMore, setHasMore] = useState(initialHasMore)
const [cursor, setCursor] = useState<CorrectionReviewsPageCursor | null>(initialCursor)
const [loadingMore, setLoadingMore] = useState(false)
const [notice, setNotice] = useState<string | null>(() =>
  missingFocusNotice(initialRows, focusId, BRAND_FOCUS_COPY)
)
const [fetchedRelated, setFetchedRelated] = useState<CorrectionReviewRow[]>([])
const [expandedImg, setExpandedImg] = useState<string | null>(null)
const activeRailRef = useRef<HTMLButtonElement | null>(null)
const queueRef = useRef(queue)
const cursorRef = useRef(cursor)
const loadingMoreRef = useRef(false)
queueRef.current = queue
cursorRef.current = cursor

const { rows, focusIndex } = queue
const focused = rows[focusIndex] ?? null
const focusedId = focused?.id ?? null
const focusedProductId = focused?.product_id ?? null
const related = focused ? relatedClaims(focused, rows, fetchedRelated) : []
const headerLabel = waitingLabel(pendingCount, hasMore, rows.length)

useEffect(() => {
  activeRailRef.current?.scrollIntoView({ block: 'nearest' })
}, [focusIndex])

useEffect(() => {
  replaceBrandCursor(focused?.id ?? null)
}, [focused?.id])

useEffect(() => {
  if (!notice) return
  const t = window.setTimeout(() => setNotice(null), 8000)
  return () => window.clearTimeout(t)
}, [notice])

useEffect(() => {
  if (focusedId == null || focusedProductId == null) {
    setFetchedRelated([])
    return
  }
  let cancelled = false
  void listRelatedBrandCorrectionsAction(focusedProductId)
    .then((list) => {
      if (cancelled) return
      setFetchedRelated(list.filter((r) => r.id !== focusedId))
    })
    .catch(() => {
      if (!cancelled) setFetchedRelated([])
    })
  return () => {
    cancelled = true
  }
}, [focusedId, focusedProductId])

const appendPage = useCallback(async () => {
  const pageCursor = cursorRef.current
  if (!pageCursor || loadingMoreRef.current) return
  loadingMoreRef.current = true
  setLoadingMore(true)
  try {
    const page = await loadMoreBrandCorrectionsAction({ cursor: pageCursor })
    const seen = new Set(queueRef.current.rows.map((r) => r.id))
    const added = page.rows.filter((r) => !seen.has(r.id)).length
    dispatch({ type: 'append', incoming: page.rows })
    setHasMore(added > 0 && page.hasMore)
    setCursor(added > 0 ? page.nextCursor : null)
  } catch {
    setHasMore(false)
  } finally {
    loadingMoreRef.current = false
    setLoadingMore(false)
  }
}, [])

useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        return
      }
    }
    if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
      e.preventDefault()
      dispatch({ type: 'focus', index: Math.min(focusIndex + 1, Math.max(rows.length - 1, 0)) })
      return
    }
    if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
      e.preventDefault()
      dispatch({ type: 'focus', index: Math.max(focusIndex - 1, 0) })
      return
    }
    if (e.key === 'Escape') {
      setExpandedImg(null)
    }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [focusIndex, rows.length])

  return {
    nowMs,
    rows,
    focusIndex,
    focused,
    related,
    headerLabel,
    hasMore,
    cursor,
    loadingMore,
    notice,
    expandedImg,
    setExpandedImg,
    activeRailRef,
    appendPage,
    dispatch,
  }
}
