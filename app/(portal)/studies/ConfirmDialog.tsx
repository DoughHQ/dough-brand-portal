'use client'

import type { ReactNode } from 'react'
import ConfirmDialogCard from './confirmDialog/ConfirmDialogCard'
import type { Tone } from './confirmDialog/confirmTone'

/**
 * Lightweight portal confirm — replaces window.confirm for study trash / close.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: Tone
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <ConfirmDialogCard
      title={title}
      body={body}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
