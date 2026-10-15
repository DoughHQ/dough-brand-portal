import type { PrototypeEditorState } from './usePrototypeEditor'

export function EditorFooter({
  onClose,
  pending,
  prototypeId,
  archive,
  save,
}: { onClose: () => void } & Pick<PrototypeEditorState, 'pending' | 'prototypeId' | 'archive' | 'save'>) {
  return (
    <footer className="proto-editor-footer">
      {prototypeId ? (
        <button type="button" className="proto-quiet-btn proto-danger" disabled={pending} onClick={archive}>
          Archive
        </button>
      ) : (
        <span />
      )}
      <div className="proto-editor-footer-right">
        <button type="button" className="proto-quiet-btn" disabled={pending} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="proto-primary-btn"
          disabled={pending}
          onClick={() => save(true)}
        >
          {pending ? 'Saving…' : prototypeId ? 'Save' : 'Create prototype'}
        </button>
      </div>
    </footer>
  )
}
