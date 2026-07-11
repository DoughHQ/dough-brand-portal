'use client'

import type { CSSProperties, ReactNode } from 'react'

type Tone = 'default' | 'destructive' | 'caution'

const toneStyles: Record<
  Tone,
  { confirmBg: string; confirmColor: string; border: string }
> = {
  default: {
    confirmBg: 'var(--sage)',
    confirmColor: 'white',
    border: '1px solid var(--ink-10)',
  },
  caution: {
    confirmBg: 'var(--ink)',
    confirmColor: 'white',
    border: '1px solid var(--ink-10)',
  },
  destructive: {
    confirmBg: '#8B2E2E',
    confirmColor: 'white',
    border: '1px solid rgba(139, 46, 46, 0.35)',
  },
}

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

  const t = toneStyles[tone]
  const backdrop: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20, 24, 22, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  }
  const card: CSSProperties = {
    width: '100%',
    maxWidth: 420,
    background: 'var(--white)',
    borderRadius: 'var(--r-md)',
    border: t.border,
    padding: '22px 24px',
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-confirm-title"
      style={backdrop}
      onClick={onCancel}
    >
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <h2
          id="portal-confirm-title"
          style={{
            margin: '0 0 10px',
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 400,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h2>
        <div style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, marginBottom: 22 }}>
          {body}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            style={{
              border: '1px solid var(--ink-10)',
              background: 'var(--white)',
              color: 'var(--ink-50)',
              borderRadius: 'var(--r-sm)',
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            style={{
              border: 'none',
              background: t.confirmBg,
              color: t.confirmColor,
              borderRadius: 'var(--r-sm)',
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
