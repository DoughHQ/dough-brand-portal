import type { PendingDeclare } from '../types'
import ModalFrame from './ModalFrame'

export default function NationwideConfirmModal({
  pending,
  busy,
  onCancel,
  onConfirm,
}: {
  pending: PendingDeclare
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ModalFrame
      title="Confirm nationwide"
      description={
        <>
          Shoppers anywhere will see this as carried at this retailer
          {pending.skuVariantId == null ? ' for all pack sizes' : ''}. One
          misclick is a national claim.
        </>
      }
      busy={busy}
      onClose={onCancel}
    >
        <div className="wis-modal-actions">
          <button
            type="button"
            className="wis-btn wis-btn--quiet"
            onClick={onCancel}
            disabled={busy}
          >
            Back
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={onConfirm}
            disabled={busy}
          >
            Confirm nationwide
          </button>
        </div>
    </ModalFrame>
  )
}
