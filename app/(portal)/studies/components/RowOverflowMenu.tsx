'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import RowOverflowPanel, { type OverflowAction } from './rowOverflow/RowOverflowPanel'
import { EST_ITEM_H, EST_PAD, MIN_WIDTH, placeMenu, type MenuPos } from './rowOverflow/placeMenu'

export type { OverflowAction }

type Props = {
  actions: OverflowAction[]
  label?: string
}

export default function RowOverflowMenu({ actions, label = 'More actions' }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const menu = menuRef.current
    const menuW = menu?.offsetWidth || MIN_WIDTH
    const menuH =
      menu?.offsetHeight || actions.length * EST_ITEM_H + EST_PAD
    const next = placeMenu(rect, menuW, menuH)
    setPos((prev) =>
      prev && prev.top === next.top && prev.left === next.left ? prev : next,
    )
  }, [actions.length])

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    updatePos()
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open, updatePos])

  if (actions.length === 0) return null

  const menu = open
    ? createPortal(
        <RowOverflowPanel
          actions={actions}
          pos={pos}
          menuRef={menuRef}
          onClose={() => setOpen(false)}
        />,
        document.body,
      )
    : null

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        className={`studies-kebab${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {menu}
    </div>
  )
}
