import type { RefObject } from 'react'
import type { ConfirmRequest } from './confirmRequest'

export default function ConfirmDialogPanel({
  request,
  onCancel,
  panelRef,
  confirmRef,
  restoreFocus,
}: {
  request: ConfirmRequest
  onCancel: () => void
  panelRef: RefObject<HTMLDivElement | null>
  confirmRef: RefObject<HTMLButtonElement | null>
  restoreFocus: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cb-confirm-title"
      aria-describedby="cb-confirm-body"
      className="cb-confirm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
          restoreFocus()
        }
      }}
    >
      <div className="cb-confirm-panel" ref={panelRef}>
        <h2 id="cb-confirm-title" className="cb-confirm-title">
          {request.title}
        </h2>
        <p id="cb-confirm-body" className="cb-confirm-body">
          {request.body}
        </p>
        <div className="cb-confirm-actions">
          <button
            type="button"
            data-cancel
            className="cb-btn-outline"
            onClick={() => {
              onCancel()
              restoreFocus()
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            ref={confirmRef}
            className="cb-btn cb-btn-primary"
            onClick={() => {
              request.onConfirm()
              onCancel()
            }}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
