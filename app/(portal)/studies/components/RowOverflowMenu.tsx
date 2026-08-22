'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'

export type OverflowAction = {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

type Props = {
  actions: OverflowAction[]
  label?: string
}

const GAP = 4
const VIEWPORT_PAD = 8
const MIN_WIDTH = 160
const EST_ITEM_H = 38
const EST_PAD = 8

const itemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  padding: '9px 14px',
}

type MenuPos = { top: number; left: number }

function placeMenu(
  button: DOMRect,
  menuW: number,
  menuH: number,
): MenuPos {
  const spaceBelow = window.innerHeight - button.bottom - GAP - VIEWPORT_PAD
  const spaceAbove = button.top - GAP - VIEWPORT_PAD
  const openUp = spaceBelow < menuH && spaceAbove > spaceBelow

  let top = openUp ? button.top - GAP - menuH : button.bottom + GAP
  top = Math.max(
    VIEWPORT_PAD,
    Math.min(top, window.innerHeight - menuH - VIEWPORT_PAD),
  )

  let left = button.right - menuW
  left = Math.max(
    VIEWPORT_PAD,
    Math.min(left, window.innerWidth - menuW - VIEWPORT_PAD),
  )

  return { top, left }
}

export default function RowOverflowMenu({
  actions,
  label = 'More actions',
}: Props) {
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
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            visibility: pos ? 'visible' : 'hidden',
            minWidth: MIN_WIDTH,
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            boxShadow: '0 8px 24px rgba(36, 61, 44, 0.08)',
            zIndex: 400,
            overflow: 'hidden',
            padding: '4px 0',
          }}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              disabled={a.disabled}
              style={{
                ...itemStyle,
                color:
                  a.tone === 'danger' ? 'var(--red, #B83A24)' : 'var(--ink)',
                opacity: a.disabled ? 0.45 : 1,
                cursor: a.disabled ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (a.disabled) return
                setOpen(false)
                a.onClick()
              }}
            >
              {a.label}
            </button>
          ))}
        </div>,
        document.body,
      )
    : null

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid transparent',
          background: open ? 'var(--surface-1)' : 'transparent',
          cursor: 'pointer',
          color: 'var(--ink-50)',
          fontSize: 18,
          lineHeight: 1,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-sans)',
        }}
      >
        ⋯
      </button>
      {menu}
    </div>
  )
}
