import {
  facetValueLabel,
  isPendingReviewState,
  reviewStateLabel,
  type DeclarableFacetRow,
  type FacetDeclaredValue,
} from '@/lib/facets/productFacets'
import { NoteEditComposer } from './NoteEditComposer'
import type { FlavorNotesState } from './useFlavorNotes'

export function NoteItem({
  d,
  row,
  showPicker,
  busy,
  editingId,
  setEditingId,
  editNote,
  setEditNote,
  setDraftValue,
  onWithdraw,
  saveEdit,
}: { d: FacetDeclaredValue; row: DeclarableFacetRow } & Pick<
  FlavorNotesState,
  | 'showPicker'
  | 'busy'
  | 'editingId'
  | 'setEditingId'
  | 'editNote'
  | 'setEditNote'
  | 'setDraftValue'
  | 'onWithdraw'
  | 'saveEdit'
>) {
  const label = facetValueLabel(row, d.value, d.label)
  const state = reviewStateLabel(d.review_state)
  const editing = editingId === d.declaration_id
  return (
    <li
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
        <NoteEditComposer
          d={d}
          busy={busy}
          editNote={editNote}
          setEditNote={setEditNote}
          setEditingId={setEditingId}
          saveEdit={saveEdit}
        />
      ) : d.brand_note ? (
        <p className="pf-note__quote">“{d.brand_note}”</p>
      ) : null}
    </li>
  )
}
