import { FacetChipAdd } from '@/components/products/FacetValuePicker'
import { DraftComposer } from './DraftComposer'
import type { FlavorNotesState } from './useFlavorNotes'

export function NotesAdd({
  showPicker,
  draftValue,
  available,
  taken,
  busy,
  setEditingId,
  setDraftValue,
  setDraftNote,
  draftLabel,
  draftNote,
  commitDraft,
}: Pick<
  FlavorNotesState,
  | 'showPicker'
  | 'draftValue'
  | 'available'
  | 'taken'
  | 'busy'
  | 'setEditingId'
  | 'setDraftValue'
  | 'setDraftNote'
  | 'draftLabel'
  | 'draftNote'
  | 'commitDraft'
>) {
  return showPicker ? (
    <div className="pf-notes__add">
      {draftValue ? (
        <DraftComposer
          draftLabel={draftLabel}
          draftNote={draftNote}
          setDraftNote={setDraftNote}
          setDraftValue={setDraftValue}
          busy={busy}
          commitDraft={commitDraft}
        />
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
  ) : null
}
