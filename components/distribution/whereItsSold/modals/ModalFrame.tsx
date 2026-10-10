'use client'

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function ModalFrame({
  title,
  description,
  busy,
  onClose,
  children,
}: {
  title: string
  description: ReactNode
  busy: boolean
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const firstFocusable =
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    const focusTarget = firstFocusable ?? dialogRef.current
    focusTarget?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
    ]
    if (focusable.length === 0) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    const first = focusable[0]!
    const last = focusable.at(-1)!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="wis-modal-backdrop">
      <div
        ref={dialogRef}
        className="wis-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <h3 id={titleId}>{title}</h3>
        <p id={descriptionId} className="wis-modal-sub">
          {description}
        </p>
        {children}
      </div>
    </div>
  )
}
