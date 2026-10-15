import type { FacetDeclaredValue } from '@/lib/facets/productFacets'
import type { FlavorNotesState } from './useFlavorNotes'

export function NoteEditComposer({
  d,
  busy,
  editNote,
  setEditNote,
  setEditingId,
  saveEdit,
}: { d: FacetDeclaredValue } & Pick<
  FlavorNotesState,
  'busy' | 'editNote' | 'setEditNote' | 'setEditingId' | 'saveEdit'
>) {
  return (
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
  )
}
