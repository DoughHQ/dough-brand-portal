import type { DeclarableFacetRow } from '@/lib/facets/productFacets'
import { NoteItem } from './NoteItem'
import type { FlavorNotesState } from './useFlavorNotes'

export function NotesList({
  row,
  notes,
  showPicker,
  busy,
  editingId,
  setEditingId,
  editNote,
  setEditNote,
  setDraftValue,
  onWithdraw,
  saveEdit,
}: { row: DeclarableFacetRow } & Pick<
  FlavorNotesState,
  | 'notes'
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
  return notes.length > 0 ? (
    <ul className="pf-notes__list" aria-label="Declared flavour notes">
      {notes.map((d) => (
        <NoteItem
          key={d.declaration_id}
          d={d}
          row={row}
          showPicker={showPicker}
          busy={busy}
          editingId={editingId}
          setEditingId={setEditingId}
          editNote={editNote}
          setEditNote={setEditNote}
          setDraftValue={setDraftValue}
          onWithdraw={onWithdraw}
          saveEdit={saveEdit}
        />
      ))}
    </ul>
  ) : (
    <p className="pf-notes__empty">
      No flavour notes yet — add how it tastes beyond the product name.
    </p>
  )
}
