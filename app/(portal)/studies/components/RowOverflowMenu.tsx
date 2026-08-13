'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

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

export default function RowOverflowMenu({
  actions,
  label = 'More actions',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (actions.length === 0) return null

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
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
      {open ? (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            minWidth: 160,
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            boxShadow: '0 8px 24px rgba(36, 61, 44, 0.08)',
            zIndex: 40,
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
        </div>
      ) : null}
    </div>
  )
}
