import type { ReactNode } from 'react'
import { overlayStyle, panelStyle } from './dialogStyles'

export function DialogShell({
  title,
  children,
  onClose,
  busy,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
}) {
  return (
    <div
      style={overlayStyle}
      role="presentation"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            color: 'var(--ink)',
            marginBottom: 12,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}
