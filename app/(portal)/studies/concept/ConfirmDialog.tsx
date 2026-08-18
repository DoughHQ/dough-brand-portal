'use client'

import { useEffect, useRef } from 'react'

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
export type ConfirmRequest = {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
}

type Props = {
  request: ConfirmRequest | null
  onCancel: () => void
}

export default function ConfirmDialog({ request, onCancel }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  // The control that opened the dialog, so focus can go home on cancel.
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!request) return
    returnTo.current = document.activeElement as HTMLElement | null
    // Focus lands on Cancel, not the destructive action — a stray Enter should
    // never be the thing that removes the operator's variants.
    const cancelBtn = panelRef.current?.querySelector<HTMLButtonElement>('[data-cancel]')
    cancelBtn?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>('button')
      if (!focusables?.length) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [request, onCancel])

  if (!request) return null

  const restoreFocus = () => returnTo.current?.focus()

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
