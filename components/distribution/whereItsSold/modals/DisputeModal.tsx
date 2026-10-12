'use client'

import { useId, useState } from 'react'
import ModalFrame from './ModalFrame'
import { PRODUCT_NAME } from '@/lib/brand'

export default function DisputeModal({
  place,
  busy,
  onClose,
  onSubmit,
}: {
  place: string
  busy: boolean
  onClose: () => void
  onSubmit: (note: string) => void
}) {
  const [note, setNote] = useState('')
  const noteId = useId()
  return (
    <ModalFrame
      title={`Dispute ${place}`}
      description={`Every pending shopper report at this place stays on file and visible. Nothing is deleted — ${PRODUCT_NAME} will review.`}
      busy={busy}
      onClose={onClose}
    >
        <div className="wis-field">
          <label htmlFor={noteId}>Why are you disputing?</label>
          <textarea
            id={noteId}
            value={note}
            disabled={busy}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Required"
          />
        </div>
        <div className="wis-modal-actions">
          <button
            type="button"
            className="wis-btn wis-btn--quiet"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            disabled={busy || !note.trim()}
            onClick={() => onSubmit(note.trim())}
          >
            Dispute
          </button>
        </div>
    </ModalFrame>
  )
}
