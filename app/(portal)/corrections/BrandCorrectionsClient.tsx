'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import Link from 'next/link'
import type { CorrectionReviewRow, CorrectionReviewsPageCursor } from '@/lib/corrections.shared'
import {
  brandClaimCopy,
  fieldLabel,
  formatCategoryPath,
  productTitle,
  waitingAge,
} from '@/lib/correctionsCase'
import {
  BRAND_FOCUS_COPY,
  correctionsDeskHref,
  initialFocusIndex,
  missingFocusNotice,
  reduceDeskQueue,
  relatedClaims,
  replaceBrandCursor,
  type DeskQueue,
  type DeskQueueAction,
} from '@/lib/correctionsDesk'
import {
  listRelatedBrandCorrectionsAction,
  loadMoreBrandCorrectionsAction,
} from './actions'
import { formatUtcStamp } from '@/lib/portal-ui/format'
import '../admin/corrections/correctionsCase.css'

type QueueState = DeskQueue<CorrectionReviewRow>
type QueueAction = DeskQueueAction<CorrectionReviewRow>

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  return reduceDeskQueue(state, action)
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

function waitingLabel(count: number, hasMore: boolean, inView: number): string {
  if (count <= 0 && inView === 0) return 'Nothing waiting'
  if (count === 1) return '1 waiting on Dough'
  if (count > 0) return `${count} waiting on Dough`
  return `${inView} in view${hasMore ? ' · more' : ''}`
}

interface Props {
  initialRows: CorrectionReviewRow[]
  initialHasMore?: boolean
  initialCursor?: CorrectionReviewsPageCursor | null
  pendingCount?: number
  focusId?: string | null
  canReviewInOps?: boolean
  renderedAt?: number
}

export default function BrandCorrectionsClient({
  initialRows,
  initialHasMore = false,
  initialCursor = null,
  pendingCount = 0,
  focusId = null,
  canReviewInOps = false,
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
    if (!focused) {
      setFetchedRelated([])
      return
    }
    const productId = focused.product_id
    const openId = focused.id
    let cancelled = false
    void listRelatedBrandCorrectionsAction(productId)
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

  return (
    <div className="corr-page">
      <div className="corr-head">
        <div>
          <div className="corr-kicker">Catalog</div>
          <h1 className="corr-title">Corrections</h1>
        </div>
        <div className="corr-meta">
          <span>{headerLabel}</span>
          {canReviewInOps && focused ? (
            <Link href={correctionsDeskHref({ focusId: focused.id })}>Review in Ops</Link>
          ) : null}
        </div>
      </div>

      {notice && <div className="corr-banner corr-banner-info">{notice}</div>}

      {rows.length === 0 ? (
        <div className="corr-empty">
          {loadingMore ? (
            <p className="corr-empty-title">Loading…</p>
          ) : (
            <>
              <p className="corr-empty-title">Quiet catalog</p>
              <p className="corr-empty-body">
                No shopper reports waiting on your products. When someone flags a name, photo, or
                shelf, it shows up here while Dough reviews it.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="corr-desk">
          <aside className="corr-rail" aria-label="Correction inbox">
            <div className="corr-rail-head">
              <span className="corr-rail-kicker">Inbox</span>
              <span className="corr-rail-count">{headerLabel}</span>
            </div>
            <div className="corr-rail-list">
              {rows.map((row, idx) => {
                const title = productTitle(row)
                const copy = brandClaimCopy(row)
                const age = waitingAge(row.created_at, nowMs)
                const on = idx === focusIndex
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={on ? 'corr-rail-item is-on' : 'corr-rail-item'}
                    aria-current={on ? 'true' : undefined}
                    ref={on ? activeRailRef : undefined}
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
                  disabled={loadingMore || !cursor}
                  onClick={() => void appendPage()}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              ) : null}
              <span className="corr-keys">J / K move</span>
            </div>
          </aside>

          {focused ? (
            <StatusStage
              row={focused}
              nowMs={nowMs}
              related={related}
              canReviewInOps={canReviewInOps}
              onOpenRelated={(row) => dispatch({ type: 'openRelated', row })}
              onExpandEvidence={() => setExpandedImg(focused.evidence_image_url)}
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

function StatusStage({
  row,
  nowMs,
  related,
  canReviewInOps,
  onOpenRelated,
  onExpandEvidence,
}: {
  row: CorrectionReviewRow
  nowMs: number
  related: CorrectionReviewRow[]
  canReviewInOps: boolean
  onOpenRelated: (row: CorrectionReviewRow) => void
  onExpandEvidence: () => void
}) {
  const title = productTitle(row)
  const copy = brandClaimCopy(row)
  const age = waitingAge(row.created_at, nowMs)
  const path = formatCategoryPath(row.current_category_path)
  const hasEvidence = Boolean(row.evidence_image_url)
  const showDiff = Boolean(row.current_category && row.proposed_category_label)

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
          </p>

          <div className="corr-wait">
            <span className="corr-wait-pill">Waiting on Dough</span>
            <p className="corr-wait-copy">{copy.status}</p>
          </div>

          <h3 className="corr-headline">{copy.headline}</h3>
          <p className="corr-sentence">{copy.sentence}</p>
          {showDiff ? (
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

          <div className="corr-actions">
            <Link
              href={`/products/${row.product_id}`}
              className="corr-btn corr-btn-primary corr-product-cta"
            >
              Open product
            </Link>
            {canReviewInOps ? (
              <Link
                href={correctionsDeskHref({ focusId: row.id })}
                className="corr-btn corr-btn-ghost"
              >
                Review in Ops
              </Link>
            ) : null}
          </div>

          {related.length > 0 ? (
            <div className="corr-related">
              <div className="corr-related-kicker">
                {related.length === 1
                  ? '1 more report on this product'
                  : `${related.length} more reports on this product`}
              </div>
              {related.map((sib) => {
                const sibCopy = brandClaimCopy(sib)
                return (
                  <button
                    key={sib.id}
                    type="button"
                    className="corr-related-item"
                    onClick={() => onOpenRelated(sib)}
                  >
                    <span className="corr-related-field">{fieldLabel(sib)}</span>
                    <span className="corr-related-sentence">{sibCopy.sentence}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
