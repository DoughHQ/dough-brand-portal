'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  declareProductFacet,
  withdrawProductFacetDeclaration,
} from '@/lib/facets/api'
import {
  facetValueLabel,
  isLiveDeclaredState,
  isPendingReviewState,
  reviewStateLabel,
  type DeclarableFacetRow,
  type FacetDeclaredValue,
} from '@/lib/facets/productFacets'
import { FacetChipAdd } from '@/components/products/FacetValuePicker'

type Props = {
  row: DeclarableFacetRow
  productId: number
  canEdit: boolean
  busyKey: string | null
  setBusyKey: (k: string | null) => void
  setError: (e: string | null) => void
  onWrote: () => Promise<void>
  bare?: boolean
}

/**
 * Flavour Notes — controlled vocabulary + optional tasting note per value.
 * Shoppers filter on the descriptor; the brand note is voice, not a filter key.
 */
export function FlavorNotesPanel({
  row,
  productId,
  canEdit,
  busyKey,
  setBusyKey,
  setError,
  onWrote,
  bare = false,
}: Props) {
  const declared = row.declared_values ?? []
  const live = declared.filter((d) => isLiveDeclaredState(d.review_state))
  const pending = declared.filter((d) => isPendingReviewState(d.review_state))
  const available = row.available_values ?? []
  const showPicker = canEdit && available.length > 0
  const taken = useMemo(
    () => new Set([...live, ...pending].map((d) => d.value)),
    [live, pending],
  )

  const [draftValue, setDraftValue] = useState<string | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNote, setEditNote] = useState('')

  useEffect(() => {
    setDraftValue(null)
    setDraftNote('')
    setEditingId(null)
    setEditNote('')
  }, [row.facet_type, live.map((d) => d.declaration_id).join(','), pending.map((d) => d.declaration_id).join(',')])

  const draftLabel = draftValue
    ? facetValueLabel(row, draftValue, available.find((o) => o.value === draftValue)?.label)
    : null

  const busy = busyKey != null && busyKey.startsWith(`${row.facet_type}:`)

  const onWithdraw = async (declarationId: number) => {
    if (!showPicker) return
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:w-${declarationId}`)
    setError(null)
    const res = await withdrawProductFacetDeclaration(supabase, declarationId, false)
    setBusyKey(null)
    if (res.error) {
      setError(res.error)
      return
    }
    await onWrote()
  }

  const commitDraft = async () => {
    if (!showPicker || !draftValue) return
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:declare`)
    setError(null)
    const res = await declareProductFacet(supabase, {
      productId,
      facetType: row.facet_type,
      facetValue: draftValue,
      brandNote: draftNote.trim() || null,
    })
    setBusyKey(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setDraftValue(null)
    setDraftNote('')
    await onWrote()
  }

  const saveEdit = async (d: FacetDeclaredValue) => {
    if (!showPicker) return
    const next = editNote.trim()
    const prev = (d.brand_note ?? '').trim()
    if (next === prev) {
      setEditingId(null)
      return
    }
    // Re-declare same value updates brand_note when a non-empty note is sent.
    // Clearing a note isn't supported by the RPC (nullif skips empty) — leave as-is.
    if (!next) {
      setError('Tasting notes can’t be cleared here yet — withdraw and re-add if you need a blank note.')
      return
    }
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:note-${d.declaration_id}`)
    setError(null)
    const res = await declareProductFacet(supabase, {
      productId,
      facetType: row.facet_type,
      facetValue: d.value,
      brandNote: next,
    })
    setBusyKey(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setEditingId(null)
    setEditNote('')
    await onWrote()
  }

  const notes = [...live, ...pending]

  const body = (
    <>
      <p className="pf-notes__lede">
        Pick descriptors shoppers can filter on. Add your own words for how it tastes —
        that note stays with the brand, not the filter.
      </p>

      {notes.length > 0 ? (
        <ul className="pf-notes__list" aria-label="Declared flavour notes">
          {notes.map((d) => {
            const label = facetValueLabel(row, d.value, d.label)
            const state = reviewStateLabel(d.review_state)
            const editing = editingId === d.declaration_id
            return (
              <li
                key={d.declaration_id}
                className={`pf-note${isPendingReviewState(d.review_state) ? ' pf-note--pending' : ''}`}
              >
                <div className="pf-note__head">
                  <div className="pf-note__titles">
                    <span className="pf-note__label">{label}</span>
                    {state ? <span className="pf-note__state">{state}</span> : null}
                  </div>
                  {showPicker ? (
                    <div className="pf-note__actions">
                      {!editing ? (
                        <button
                          type="button"
                          className="pf-note__ghost"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(d.declaration_id)
                            setEditNote(d.brand_note ?? '')
                            setDraftValue(null)
                          }}
                        >
                          {d.brand_note ? 'Edit note' : 'Add note'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="pf-note__remove"
                        aria-label={`Remove ${label}`}
                        disabled={busy}
                        onClick={() => void onWithdraw(d.declaration_id)}
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>

                {editing ? (
                  <div className="pf-note__composer">
                    <label className="pf-note__field">
                      <span>Your tasting note</span>
                      <textarea
                        rows={2}
                        value={editNote}
                        placeholder="e.g. Finishes cold and clean."
                        disabled={busy}
                        onChange={(e) => setEditNote(e.target.value)}
                        autoFocus
                      />
                    </label>
                    <div className="pf-note__composer-actions">
                      <button
                        type="button"
                        className="pf-btn pf-btn--ghost"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(null)
                          setEditNote('')
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="pf-btn"
                        disabled={busy || !editNote.trim()}
                        onClick={() => void saveEdit(d)}
                      >
                        {busy ? 'Saving…' : 'Save note'}
                      </button>
                    </div>
                  </div>
                ) : d.brand_note ? (
                  <p className="pf-note__quote">“{d.brand_note}”</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="pf-notes__empty">
          No flavour notes yet — add how it tastes beyond the product name.
        </p>
      )}

      {showPicker ? (
        <div className="pf-notes__add">
          {draftValue ? (
            <div className="pf-note__composer pf-note__composer--draft">
              <div className="pf-note__draft-head">
                <span className="pf-note__draft-kicker">Adding</span>
                <span className="pf-note__label">{draftLabel}</span>
              </div>
              <label className="pf-note__field">
                <span>Your tasting note (optional)</span>
                <textarea
                  rows={2}
                  value={draftNote}
                  placeholder="e.g. Finishes cold and clean."
                  disabled={busy}
                  onChange={(e) => setDraftNote(e.target.value)}
                  autoFocus
                />
              </label>
              <div className="pf-note__composer-actions">
                <button
                  type="button"
                  className="pf-btn pf-btn--ghost"
                  disabled={busy}
                  onClick={() => {
                    setDraftValue(null)
                    setDraftNote('')
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pf-btn"
                  disabled={busy}
                  onClick={() => void commitDraft()}
                >
                  {busy ? 'Saving…' : draftNote.trim() ? 'Add with note' : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <FacetChipAdd
              options={available}
              takenValues={taken}
              disabled={busy}
              placeholder="Add a flavour note…"
              onAdd={(value) => {
                setEditingId(null)
                setDraftValue(value)
                setDraftNote('')
              }}
            />
          )}
        </div>
      ) : null}
    </>
  )

  if (bare) return <div className="pf-claim pf-claim--bare pf-notes">{body}</div>

  return (
    <article className="pf-claim pf-notes">
      <div className="pf-claim__head">
        <div className="pf-claim__title-row">
          <h4 className="pf-claim__title">{row.display_name}</h4>
        </div>
        <span className="pf-claim__badge pf-claim__badge--soft">
          {available.length} descriptors
        </span>
      </div>
      {body}
    </article>
  )
}
