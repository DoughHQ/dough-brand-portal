'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import Link from 'next/link'
import {
  canApproveAsIs,
  PHOTO_ONLY_TYPES,
  type CorrectionReviewRow,
  type CorrectionReviewsPageCursor,
} from '@/lib/corrections.shared'
import {
  brandMismatchWork,
  claimCopy,
  correctionCaseMode,
  fieldLabel,
  formatCategoryPath,
  primaryVerb,
  productTitle,
  relatedBrandClaim,
  waitingAge,
} from '@/lib/correctionsCase'
import {
  correctionsDeskHref,
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
} from './actions'
import CaseEditor from './CaseEditor'
import { formatUtcStamp } from '@/lib/portal-ui/format'
import './correctionsCase.css'

const REJECT_CHIPS = [
  'Wrong product',
  'Unreadable photo',
  'Spam / duplicate',
  'Not enough evidence',
  'Category is already correct',
  'Out of scope',
] as const

const PREFETCH_BELOW = 8

type QueueState = DeskQueue<CorrectionReviewRow>
type QueueAction = DeskQueueAction<CorrectionReviewRow>

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  return reduceDeskQueue(state, action)
}

function proposedApplyLabel(row: CorrectionReviewRow): string {
  const ct = (row.correction_type ?? '').toLowerCase()
  if (ct === 'category') return row.proposed_category_label ?? 'this category'
  if (ct === 'name') {
    return String((row.proposed_value as { name?: string } | null)?.name ?? 'this name')
  }
  if (ct === 'brand') {
    const v = row.proposed_value as { brand_name?: string; brand?: string } | null
    return String(v?.brand_name ?? v?.brand ?? 'this brand')
  }
  if (ct === 'product_image') return 'new photo'
  return 'this change'
}

function ProductArt({
  url,
  name,
  className,
  letterClass,
}: {
  url: string | null
  name: string
  className: string
  letterClass: string
}) {
  if (url) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" />
      </div>
    )
  }
  const letter = (name.trim().slice(0, 1) || '?').toUpperCase()
  return (
    <div className={className} aria-hidden>
      <span className={letterClass}>{letter}</span>
    </div>
  )
}

interface Props {
  initialRows: CorrectionReviewRow[]
  initialHasMore?: boolean
  initialCursor?: CorrectionReviewsPageCursor | null
  focusId?: string | null
  productFilterId?: number | null
  workspaceBrandId?: number | null
  workspaceBrandName?: string | null
  renderedAt?: number
}

export default function CorrectionsReviewClient({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  focusId = null,
  productFilterId = null,
  workspaceBrandId = null,
  workspaceBrandName = null,
  renderedAt,
}: Props) {
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

  useEffect(() => {
    if (!focused) {
      setFetchedRelated([])
      return
    }
    const productId = focused.product_id
    const openId = focused.id
    let cancelled = false
    void listRelatedCorrectionsAction(productId)
      .then((list) => {
        if (cancelled) return
        setFetchedRelated(list.filter((r) => r.id !== openId))
      })
      .catch(() => {
        if (!cancelled) setFetchedRelated([])
      })
    return () => {
      cancelled = true
    }
  }, [focused?.id, focused?.product_id])

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
        setEditorOpenId(current.id)
        return
      }
      if (e.key === 'e' || e.key === 'E') {
        const ct = (current.correction_type ?? '').toLowerCase()
        if (PHOTO_ONLY_TYPES.has(ct) && current.evidence_image_url) {
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

  return (
    <div className="corr-page">
      <div className="corr-head">
        <div>
          <div className="corr-kicker">Ops</div>
          <h1 className="corr-title">Corrections</h1>
        </div>
        <div className="corr-meta">
          {filtered ? (
            <span className="corr-filter">
              Filtered to this product
              <Link href={correctionsDeskHref({ focusId: focused?.id })}>Clear</Link>
            </span>
          ) : (
            <span>{queueLabel}</span>
          )}
        </div>
      </div>

      {error && <div className="corr-banner corr-banner-error">{error}</div>}
      {notice && <div className="corr-banner corr-banner-info">{notice}</div>}
      {flash && <div className="corr-banner corr-banner-ok">{flash}</div>}

      {rows.length === 0 ? (
        <div className="corr-empty">
          {loadingMore ? (
            <p className="corr-empty-title">Loading next…</p>
          ) : filtered ? (
            <>
              <p className="corr-empty-title">Nothing pending on this product</p>
              <p className="corr-empty-body">
                The filter is on. Completing a case here does not jump into the global inbox.
              </p>
              <Link href={correctionsDeskHref()} className="corr-empty-link">
                Open the full queue
              </Link>
            </>
          ) : (
            <>
              <p className="corr-empty-title">Inbox zero</p>
              <p className="corr-empty-body">No corrections waiting for review.</p>
            </>
          )}
        </div>
      ) : (
        <div className="corr-desk">
          <aside className="corr-rail" aria-label="Correction queue">
            <div className="corr-rail-head">
              <span className="corr-rail-kicker">Queue</span>
              <span className="corr-rail-count">{queueLabel}</span>
            </div>
            <div className="corr-rail-list">
              {rows.map((row, idx) => {
                const title = productTitle(row)
                const copy = claimCopy(row)
                const age = waitingAge(row.created_at, nowMs)
                const on = idx === focusIndex
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={on ? 'corr-rail-item is-on' : 'corr-rail-item'}
                    aria-current={on ? 'true' : undefined}
                    ref={on ? activeRailRef : undefined}
                    disabled={busyId != null}
                    onClick={() => dispatch({ type: 'focus', index: idx })}
                  >
                    <ProductArt
                      url={row.product_image_url}
                      name={title}
                      className="corr-thumb"
                      letterClass="corr-thumb-letter"
                    />
                    <div className="corr-rail-copy">
                      <div className="corr-row-type">{fieldLabel(row)}</div>
                      <div className="corr-row-title">{title}</div>
                      <div className="corr-row-claim">{copy.sentence}</div>
                    </div>
                    <div className="corr-row-age">{age}</div>
                  </button>
                )
              })}
            </div>
            <div className="corr-rail-foot">
              {hasMore ? (
                <button
                  type="button"
                  className="corr-btn corr-btn-ghost corr-rail-more"
                  disabled={loadingMore || !cursor || busyId != null}
                  onClick={() => void appendPage()}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              ) : (
                <span className="corr-keys">J / K move · A apply</span>
              )}
              {hasMore ? <span className="corr-keys">J / K move · A apply</span> : null}
            </div>
          </aside>

          {focused ? (
            <CaseStage
              row={focused}
              busy={busyId === focused.id}
              nowMs={nowMs}
              workspaceBrandId={workspaceBrandId}
              workspaceBrandName={workspaceBrandName}
              editorOpen={editorOpenId === focused.id}
              rejectChip={rejectChipById[focused.id] ?? null}
              related={related}
              onOpenRelated={openRelated}
              onExtract={() => void handleExtract(focused.id)}
              onOpenEditor={() => setEditorOpenId(focused.id)}
              onCloseEditor={() => setEditorOpenId(null)}
              onExpandEvidence={() => setExpandedImg(focused.evidence_image_url)}
              onPickReject={(chip) => {
                setRejectChipById((prev) => ({ ...prev, [focused.id]: chip }))
                setError(null)
              }}
              onApply={() => void handleDecision(focused.id, 'approved')}
              onApplyValue={(value, skuVariantId) => {
                void handleDecision(focused.id, 'overridden', {
                  correctedValue: value,
                  skuVariantId,
                })
              }}
              onReject={() => {
                const chip = rejectChipById[focused.id]
                if (!chip) {
                  setError('Pick a reject reason first.')
                  return
                }
                void handleDecision(focused.id, 'rejected', { notes: chip })
              }}
            />
          ) : null}
        </div>
      )}

      {expandedImg && (
        <div
          role="presentation"
          className="corr-lightbox"
          onClick={() => setExpandedImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={expandedImg} alt="Evidence full size" />
        </div>
      )}
    </div>
  )
}

function CaseStage({
  row,
  busy,
  nowMs,
  workspaceBrandId,
  workspaceBrandName,
  editorOpen,
  rejectChip,
  related,
  onOpenRelated,
  onExtract,
  onOpenEditor,
  onCloseEditor,
  onExpandEvidence,
  onPickReject,
  onApply,
  onApplyValue,
  onReject,
}: {
  row: CorrectionReviewRow
  busy: boolean
  nowMs: number
  workspaceBrandId: number | null
  workspaceBrandName: string | null
  editorOpen: boolean
  rejectChip: string | null
  related: CorrectionReviewRow[]
  onOpenRelated: (row: CorrectionReviewRow) => void
  onExtract: () => void
  onOpenEditor: () => void
  onCloseEditor: () => void
  onExpandEvidence: () => void
  onPickReject: (chip: string) => void
  onApply: () => void
  onApplyValue: (value: Record<string, unknown>, skuVariantId: number | null) => void
  onReject: () => void
}) {
  const title = productTitle(row)
  const copy = claimCopy(row)
  const age = waitingAge(row.created_at, nowMs)
  const ct = (row.correction_type ?? 'other').toLowerCase()
  const mode = correctionCaseMode(row)
  const path = formatCategoryPath(row.current_category_path)
  const mismatch = brandMismatchWork({
    brandId: row.brand_id,
    brandName: row.brand_name,
    workspaceBrandId,
    workspaceBrandName,
    correctionType: row.correction_type,
  })
  const brandSib = relatedBrandClaim(related)
  const hasEvidence = Boolean(row.evidence_image_url)
  const applyLabel =
    mode === 'confirm'
      ? `Apply “${proposedApplyLabel(row)}”`
      : primaryVerb(mode, ct)

  return (
    <article className="corr-case" data-correction-id={row.id}>
      <div className="corr-case-grid">
        <div className="corr-photo">
          {row.product_image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.product_image_url} alt={title} />
              <span className="corr-photo-badge">Product</span>
            </>
          ) : (
            <span className="corr-photo-letter">
              {(title.trim().slice(0, 1) || '?').toUpperCase()}
            </span>
          )}
        </div>

        <div className="corr-body">
          <div className="corr-age" title={formatUtcStamp(row.created_at)}>
            {age || formatUtcStamp(row.created_at)}
          </div>
          <h2 className="corr-product">{title}</h2>
          <p className="corr-identity">
            {[row.brand_name, path ?? row.current_category].filter(Boolean).join(' · ')}
            {' · '}
            <Link href={`/products/${row.product_id}`} target="_blank" rel="noreferrer">
              Open product
            </Link>
          </p>
          {mismatch ? (
            <div className="corr-mismatch">
              <p className="corr-mismatch-sentence">{mismatch.sentence}</p>
              {mismatch.thisClaimFixesIt ? (
                <p className="corr-mismatch-note">This claim is the brand fix.</p>
              ) : (
                <>
                  <p className="corr-mismatch-note">
                    Filing {fieldLabel(row).toLowerCase()} does not change the brand.
                  </p>
                  <div className="corr-mismatch-actions">
                    {brandSib ? (
                      <button
                        type="button"
                        className="corr-btn corr-btn-ghost"
                        disabled={busy}
                        onClick={() => onOpenRelated(brandSib)}
                      >
                        Open the brand claim
                      </button>
                    ) : (
                      <Link
                        href={`/products/${row.product_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="corr-mismatch-link"
                      >
                        Refile brand on the product
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}

          <h3 className="corr-headline">{copy.headline}</h3>
          <p className="corr-sentence">{copy.sentence}</p>
          {mode === 'confirm' && row.current_category && row.proposed_category_label ? (
            <p className="corr-diff">
              {row.current_category}
              {' → '}
              <span className="corr-diff-to">{row.proposed_category_label}</span>
            </p>
          ) : null}

          {hasEvidence ? (
            <button
              type="button"
              className="corr-evidence"
              onClick={onExpandEvidence}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.evidence_image_url!} alt="Submitted evidence" />
            </button>
          ) : null}

          {mode === 'extract' && hasEvidence && !editorOpen ? (
            <div className="corr-extract-row">
              <button
                type="button"
                className="corr-btn corr-btn-primary"
                disabled={busy}
                onClick={onExtract}
              >
                {busy ? 'Extracting…' : 'Extract from photo'}
              </button>
              <span className="corr-extract-hint">
                Check the draft against the photo, then apply.
              </span>
            </div>
          ) : null}

          {editorOpen && (
            <CaseEditor
              row={row}
              busy={busy}
              onCancel={onCloseEditor}
              onSubmit={(value, skuVariantId) => onApplyValue(value, skuVariantId)}
            />
          )}

          {!editorOpen && mode !== 'extract' && (
            <div className="corr-actions">
              {mode === 'confirm' ? (
                <>
                  <button
                    type="button"
                    className="corr-btn corr-btn-primary"
                    disabled={busy}
                    onClick={onApply}
                  >
                    {busy ? 'Working…' : applyLabel}
                  </button>
                  <button
                    type="button"
                    className="corr-btn corr-btn-ghost"
                    disabled={busy}
                    onClick={onOpenEditor}
                  >
                    {ct === 'category' ? 'Pick a different category' : 'Enter a different value'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="corr-btn corr-btn-primary"
                  disabled={busy}
                  onClick={onOpenEditor}
                >
                  {applyLabel}
                </button>
              )}
            </div>
          )}

          {related.length > 0 ? (
            <div className="corr-related">
              <div className="corr-related-kicker">
                {related.length === 1
                  ? '1 more claim on this product'
                  : `${related.length} more claims on this product`}
              </div>
              {related.map((sib) => {
                const sibCopy = claimCopy(sib)
                return (
                  <button
                    key={sib.id}
                    type="button"
                    className="corr-related-item"
                    disabled={busy}
                    onClick={() => onOpenRelated(sib)}
                  >
                    <span className="corr-related-field">{fieldLabel(sib)}</span>
                    <span className="corr-related-sentence">{sibCopy.sentence}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          <details className="corr-reject">
            <summary>This report is wrong</summary>
            <div className="corr-reject-body">
              {REJECT_CHIPS.map((chip) => {
                const selected = rejectChip === chip
                return (
                  <button
                    key={chip}
                    type="button"
                    className={selected ? 'corr-chip corr-chip-on' : 'corr-chip'}
                    onClick={() => onPickReject(chip)}
                  >
                    {chip}
                  </button>
                )
              })}
              <button
                type="button"
                className="corr-reject-go"
                disabled={busy || !rejectChip}
                onClick={onReject}
              >
                Reject
              </button>
            </div>
          </details>
        </div>
      </div>
    </article>
  )
}
