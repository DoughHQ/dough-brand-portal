import type { PrototypeListItem } from '@/lib/prototypes/types'

export function EditorHeader({
  initial,
  onClose,
}: {
  initial: PrototypeListItem | null
  onClose: () => void
}) {
  return (
    <header className="proto-editor-header">
      <div>
        <div className="proto-eyebrow">{initial ? 'Edit' : 'New'}</div>
        <h2 className="proto-editor-title">
          {initial ? initial.name : 'Add a prototype'}
        </h2>
        <p className="proto-help-tight">
          Private to your brand. Respondents never see the internal label. Seating in a box
          lands with the next IHUT engine.
        </p>
      </div>
      <button type="button" className="proto-quiet-btn" onClick={onClose} aria-label="Close">
        Close
      </button>
    </header>
  )
}
