'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  onStartFromProduct: () => void
}

const menuItem: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink)',
  padding: '10px 14px',
}

export default function NewStudyMenu({ onStartFromProduct }: Props) {
  const router = useRouter()
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

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--sage)',
          color: 'var(--white)',
          border: 'none',
          borderRadius: 'var(--r-sm)',
          padding: '10px 16px',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>
          +
        </span>
        New study
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            minWidth: 220,
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            boxShadow: '0 8px 24px rgba(36, 61, 44, 0.08)',
            zIndex: 50,
            overflow: 'hidden',
            padding: '4px 0',
          }}
        >
          <button
            type="button"
            role="menuitem"
            style={menuItem}
            onClick={() => {
              setOpen(false)
              router.push('/studies/concept/new')
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Concept study
          </button>
          <button
            type="button"
            role="menuitem"
            style={menuItem}
            onClick={() => {
              setOpen(false)
              onStartFromProduct()
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Start from product
          </button>
          <button
            type="button"
            role="menuitem"
            style={menuItem}
            onClick={() => {
              setOpen(false)
              router.push('/ihut')
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Launch IHUT
          </button>
        </div>
      ) : null}
    </div>
  )
}
