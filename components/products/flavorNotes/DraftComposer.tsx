import type { FlavorNotesState } from './useFlavorNotes'

export function DraftComposer({
  draftLabel,
  draftNote,
  setDraftNote,
  setDraftValue,
  busy,
  commitDraft,
}: Pick<
  FlavorNotesState,
  'draftLabel' | 'draftNote' | 'setDraftNote' | 'setDraftValue' | 'busy' | 'commitDraft'
>) {
  return (
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
  )
}
