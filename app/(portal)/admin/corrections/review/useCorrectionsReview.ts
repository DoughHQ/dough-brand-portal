'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  canApproveAsIs,
  isCaptureProductImage,
  PHOTO_ONLY_TYPES,
  type CorrectionReviewRow,
  type CorrectionReviewsPageCursor,
} from '@/lib/corrections.shared'
import { correctionCaseMode } from '@/lib/correctionsCase'
import {
  initialFocusIndex,
  isAlreadyHandledError,
  missingFocusNotice,
  reduceDeskQueue,
  relatedClaims,
  replaceDeskCursor,
  type DeskQueue,
  type DeskQueueAction,
} from '@/lib/correctionsDesk'
import {
  extractCorrectionAction,
  listRelatedCorrectionsAction,
  loadMoreCorrectionsAction,
  reviewCorrectionAction,
} from '../actions'

const PREFETCH_BELOW = 8

type QueueState = DeskQueue<CorrectionReviewRow>
type QueueAction = DeskQueueAction<CorrectionReviewRow>

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  return reduceDeskQueue(state, action)
}

export function useCorrectionsReview({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  focusId = null,
  productFilterId = null,
  renderedAt,
}: {
  initialRows: CorrectionReviewRow[]
  initialHasMore?: boolean
  initialCursor?: CorrectionReviewsPageCursor | null
  focusId?: string | null
  productFilterId?: number | null
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
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedImg, setExpandedImg] = useState<string | null>(null)
  const [rejectChipById, setRejectChipById] = useState<Record<string, string>>({})
  const [editorOpenId, setEditorOpenId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(() => missingFocusNotice(initialRows, focusId))
  const [fetchedRelated, setFetchedRelated] = useState<CorrectionReviewRow[]>([])
  const autoOpened = useRef<Set<string>>(new Set())
  const loadingMoreRef = useRef(false)
  const activeRailRef = useRef<HTMLButtonElement | null>(null)
  const queueRef = useRef(queue)
  const cursorRef = useRef(cursor)
  const hasMoreRef = useRef(hasMore)
  queueRef.current = queue
  cursorRef.current = cursor
  hasMoreRef.current = hasMore

  const { rows, focusIndex } = queue
  const focused = rows[focusIndex] ?? null
  const related = focused ? relatedClaims(focused, rows, fetchedRelated) : []

  useEffect(() => {
    activeRailRef.current?.scrollIntoView({ block: 'nearest' })
  }, [focusIndex])

  useEffect(() => {
    if (productFilterId != null) {
      replaceDeskCursor({ focusId: null, productFilterId })
      return
    }
    replaceDeskCursor({
      focusId: focused?.id ?? null,
      productFilterId: null,
    })
  }, [focused?.id, productFilterId])

  useEffect(() => {
    if (!focused) return
    const mode = correctionCaseMode(focused)
    if (mode === 'assign' && !autoOpened.current.has(focused.id)) {
      autoOpened.current.add(focused.id)
      setEditorOpenId(focused.id)
    }
  }, [focused])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 4000)
    return () => window.clearTimeout(t)
  }, [flash])

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 8000)
    return () => window.clearTimeout(t)
  }, [notice])

  const focusedId = focused?.id ?? null
  const focusedProductId = focused?.product_id ?? null

  useEffect(() => {
    if (focusedId == null || focusedProductId == null) {
      setFetchedRelated([])
      return
    }
    let cancelled = false
    void listRelatedCorrectionsAction(focusedProductId)
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

  const appendPage = useCallback(async (): Promise<boolean> => {
    const pageCursor = cursorRef.current
    if (!pageCursor || loadingMoreRef.current) return false
    loadingMoreRef.current = true
    setLoadingMore(true)
    setError(null)
    try {
      const page = await loadMoreCorrectionsAction({
        cursor: pageCursor,
        productId: productFilterId,
      })
      const seen = new Set(queueRef.current.rows.map((r) => r.id))
      const added = page.rows.filter((r) => !seen.has(r.id)).length
      dispatch({ type: 'append', incoming: page.rows })
      setHasMore(added > 0 && page.hasMore)
      setCursor(added > 0 ? page.nextCursor : null)
      return added > 0
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return false
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [productFilterId])

  useEffect(() => {
    if (rows.length === 0 || rows.length >= PREFETCH_BELOW) return
    if (!hasMore || !cursor) return
    void appendPage()
  }, [rows.length, hasMore, cursor, appendPage])

  const dropRow = useCallback((submissionId: string) => {
    const next = reduceDeskQueue(queueRef.current, { type: 'drop', id: submissionId })
    dispatch({ type: 'drop', id: submissionId })
    setRejectChipById((prev) => {
      const copy = { ...prev }
      delete copy[submissionId]
      return copy
    })
    setEditorOpenId((id) => (id === submissionId ? null : id))
    if (next.rows.length === 0 && hasMoreRef.current) {
      void appendPage()
    }
  }, [appendPage])

  const handleDecision = useCallback(
    async (
      submissionId: string,
      decision: 'approved' | 'rejected' | 'overridden',
      opts?: {
        notes?: string | null
        correctedValue?: Record<string, unknown> | null
        skuVariantId?: number | null
      }
    ) => {
      const row = queueRef.current.rows.find((r) => r.id === submissionId)
      if (!row) return

      if (decision === 'approved' && !canApproveAsIs(row)) {
        setError('Pick a category first — nothing is ready to apply.')
        setEditorOpenId(row.id)
        return
      }
      if (decision === 'rejected' && (!opts?.notes || opts.notes.trim() === '')) {
        setError('Pick a reject reason first.')
        return
      }

      setBusyId(submissionId)
      setError(null)
      const result = await reviewCorrectionAction(submissionId, decision, opts)
      setBusyId(null)
      if (!result.ok) {
        if (isAlreadyHandledError(result.error)) {
          dropRow(submissionId)
          setFlash('Already handled.')
          return
        }
        setError(result.error ?? 'Action failed')
        return
      }

      dropRow(submissionId)
      setFlash(
        decision === 'approved' || decision === 'overridden' ? 'Applied.' : 'Rejected.'
      )
    },
    [dropRow]
  )

  const handleExtract = useCallback(async (submissionId: string) => {
    setBusyId(submissionId)
    setError(null)
    const result = await extractCorrectionAction(submissionId)
    setBusyId(null)
    if (!result.ok) {
      setError(result.error ?? 'Extraction failed')
      dispatch({
        type: 'patch',
        id: submissionId,
        patch: { extraction_error: result.error ?? 'Extraction failed', extracted_value: null },
      })
      return
    }
    dispatch({
      type: 'patch',
      id: submissionId,
      patch: {
        extracted_value: result.extracted_value ?? null,
        extracted_at: new Date().toISOString(),
        extraction_error: null,
      },
    })
    setEditorOpenId(submissionId)
    setFlash('Draft ready — check it against the photo, then apply.')
  }, [])

  const openRelated = useCallback((sib: CorrectionReviewRow) => {
    dispatch({ type: 'openRelated', row: sib })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (busyId) return
      const current = queueRef.current.rows[queueRef.current.focusIndex]
      if (!current) return

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        dispatch({ type: 'focus', index: queueRef.current.focusIndex + 1 })
        return
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        dispatch({ type: 'focus', index: queueRef.current.focusIndex - 1 })
        return
      }
      if (e.key === 'a' || e.key === 'A' || e.key === 'Enter') {
        e.preventDefault()
        if (canApproveAsIs(current)) void handleDecision(current.id, 'approved')
        else setEditorOpenId(current.id)
        return
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        if (isCaptureProductImage(current)) return
        setEditorOpenId(current.id)
        return
      }
      if (e.key === 'e' || e.key === 'E') {
        const ct = (current.correction_type ?? '').toLowerCase()
        if (PHOTO_ONLY_TYPES.has(ct) && (current.evidence_preview_url || current.evidence_capture_path || current.evidence_image_url)) {
          e.preventDefault()
          void handleExtract(current.id)
        }
        return
      }
      if (e.key === 'Escape') {
        setExpandedImg(null)
        setEditorOpenId(null)
        setError(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busyId, handleDecision, handleExtract])

  const filtered = productFilterId != null
  const queueLabel =
    rows.length === 0
      ? filtered
        ? 'Nothing on this product'
        : 'Inbox zero'
      : `${rows.length} in view${hasMore ? ' · more' : ''}`
  return {
    nowMs,
    rows,
    focusIndex,
    focused,
    related,
    hasMore,
    cursor,
    loadingMore,
    busyId,
    error,
    setError,
    expandedImg,
    setExpandedImg,
    rejectChipById,
    setRejectChipById,
    editorOpenId,
    setEditorOpenId,
    flash,
    notice,
    activeRailRef,
    dispatch,
    appendPage,
    openRelated,
    handleExtract,
    handleDecision,
    filtered,
    queueLabel,
  }
}
