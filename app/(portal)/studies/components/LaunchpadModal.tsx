'use client'

import { useEffect } from 'react'
import OperatorLaunchpad from '../../components/OperatorLaunchpad'

type Props = {
  open: boolean
  onClose: () => void
}

export default function LaunchpadModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Start a study from a product"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(36, 61, 44, 0.28)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 24px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--white)',
          borderRadius: 12,
          border: '1px solid var(--ink-10)',
          boxShadow: '0 16px 48px rgba(36, 61, 44, 0.14)',
          padding: '20px 24px 28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--ink-50)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Start from product
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--ink-50)',
              lineHeight: 1,
              padding: 4,
              fontFamily: 'var(--font-sans)',
            }}
          >
            ×
          </button>
        </div>
        <OperatorLaunchpad variant="compact" />
      </div>
    </div>
  )
}
