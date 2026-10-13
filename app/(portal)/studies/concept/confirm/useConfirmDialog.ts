'use client'

import { useEffect, useRef } from 'react'
import type { ConfirmRequest } from './confirmRequest'

export function useConfirmDialog(
  request: ConfirmRequest | null,
  onCancel: () => void,
) {
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

  const restoreFocus = () => returnTo.current?.focus()

  return { panelRef, confirmRef, restoreFocus }
}
