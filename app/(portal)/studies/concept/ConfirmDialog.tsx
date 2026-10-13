'use client'

import type { ConfirmRequest } from './confirm/confirmRequest'
import ConfirmDialogPanel from './confirm/ConfirmDialogPanel'
import { useConfirmDialog } from './confirm/useConfirmDialog'

export type { ConfirmRequest } from './confirm/confirmRequest'

/**
 * The builder's own confirmation for destructive draft changes, replacing the
 * three native `window.confirm` calls Pass 1 centralised.
 *
 * Deliberately not a modal framework. It reuses the overlay, surface, radius,
 * shadow and typography already used by the publish and verification dialogs in
 * `ConceptStudyClient` — no new primitive, no new colour, no red button the
 * builder does not otherwise have. The action label carries the weight instead
 * of alarm styling.
 */

type Props = {
  request: ConfirmRequest | null
  onCancel: () => void
}

export default function ConfirmDialog({ request, onCancel }: Props) {
  const confirm = useConfirmDialog(request, onCancel)
  if (!request) return null

  return (
    <ConfirmDialogPanel
      request={request}
      onCancel={onCancel}
      panelRef={confirm.panelRef}
      confirmRef={confirm.confirmRef}
      restoreFocus={confirm.restoreFocus}
    />
  )
}
