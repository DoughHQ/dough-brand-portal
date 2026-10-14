import type { CSSProperties, Ref } from 'react'
import { MIN_WIDTH, type MenuPos } from './placeMenu'

export type OverflowAction = {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
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

type Props = {
  actions: OverflowAction[]
  pos: MenuPos | null
  menuRef: Ref<HTMLDivElement>
  onClose: () => void
}

export default function RowOverflowPanel({ actions, pos, menuRef, onClose }: Props) {
  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        visibility: pos ? 'visible' : 'hidden',
        minWidth: MIN_WIDTH,
        background: 'var(--paper)',
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
            color: a.tone === 'danger' ? 'var(--red, #B83A24)' : 'var(--ink)',
            opacity: a.disabled ? 0.45 : 1,
            cursor: a.disabled ? 'default' : 'pointer',
          }}
          onClick={() => {
            if (a.disabled) return
            onClose()
            a.onClick()
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
