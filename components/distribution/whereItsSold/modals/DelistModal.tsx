'use client'

import { useId, useState } from 'react'
import ModalFrame from './ModalFrame'

function todayIsoDate(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DelistModal({
  coveredByNational,
  busy,
  onClose,
  onSubmit,
}: {
  coveredByNational: boolean
  busy: boolean
  onClose: () => void
  onSubmit: (date: string) => void
}) {
  const [date, setDate] = useState(todayIsoDate())
  const dateId = useId()
  return (
    <ModalFrame
      title="Mark delisted"
      description="Delisting means you were carried here and no longer are, as of this date — not that the earlier claim was a mistake."
      busy={busy}
      onClose={onClose}
    >
        {coveredByNational ? (
          <p className="wis-warn">
            A nationwide claim still covers this banner. Shoppers outside this
            region may still see it.
          </p>
        ) : null}
        <div className="wis-field">
          <label htmlFor={dateId}>As of when</label>
          <input
            id={dateId}
            type="date"
            value={date}
            max={todayIsoDate()}
            disabled={busy}
            onChange={(event) => setDate(event.target.value)}
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
            className="wis-btn wis-btn--danger"
            disabled={busy || !date}
            onClick={() => onSubmit(date)}
          >
            Mark delisted
          </button>
        </div>
    </ModalFrame>
  )
}
