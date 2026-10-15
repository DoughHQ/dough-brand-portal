'use client'

import type { PrototypeListItem } from '@/lib/prototypes/types'
import { DetailsFields } from './editor/DetailsFields'
import { EditorFooter } from './editor/EditorFooter'
import { EditorHeader } from './editor/EditorHeader'
import { MediaFields } from './editor/MediaFields'
import { usePrototypeEditor } from './editor/usePrototypeEditor'

type Props = {
  brandId: number
  initial: PrototypeListItem | null
  onClose: () => void
  onSaved: (row: PrototypeListItem) => void
  onArchived: (id: string) => void
}

export default function PrototypeEditor({
  brandId,
  initial,
  onClose,
  onSaved,
  onArchived,
}: Props) {
  const editor = usePrototypeEditor({ brandId, initial, onClose, onSaved, onArchived })
  const { error } = editor

  return (
    <div className="proto-editor-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="proto-editor"
        role="dialog"
        aria-modal="true"
        aria-label={initial ? 'Edit prototype' : 'Add prototype'}
        onClick={(e) => e.stopPropagation()}
      >
        <EditorHeader initial={initial} onClose={onClose} />

        <div className="proto-editor-body">
          <DetailsFields initial={initial} {...editor} />

          <MediaFields brandId={brandId} {...editor} />

          {error ? (
            <p role="alert" className="proto-error">
              {error}
            </p>
          ) : null}
        </div>

        <EditorFooter onClose={onClose} {...editor} />
      </aside>
    </div>
  )
}
