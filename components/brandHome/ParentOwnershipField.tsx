'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  derivedParentDisplayName,
  getBrandOwnershipForPortal,
  pendingSuggestionLabel,
  type BrandOwnershipForPortal,
} from '@/lib/brandHome/brandOwnershipPortal'
import OwnershipCorrectionModal from '@/components/brandHome/OwnershipCorrectionModal'

export default function ParentOwnershipField({
  brandName,
  canSubmitCorrection,
  variant = 'editor',
}: {
  brandName: string
  canSubmitCorrection: boolean
  /** summary = Home identity line (display only). editor = existing correction UI. */
  variant?: 'summary' | 'editor'
}) {
  const [payload, setPayload] = useState<BrandOwnershipForPortal | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const reload = useCallback(async () => {
    try {
      const next = await getBrandOwnershipForPortal()
      setPayload(next)
      setLoadError(null)
    } catch {
      setLoadError('Couldn’t load ownership.')
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  if (!payload && !loadError) return null

  const parentName = payload
    ? derivedParentDisplayName(payload.derived, brandName)
    : null
  const pending = payload?.pending_correction ?? null

  if (variant === 'summary') {
    if (!parentName) return null
    return (
      <span className="bp-meta-item">
        <span className="bp-meta-icon" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 20V10l8-5 8 5v10H4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M10 20v-6h4v6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        Parent company: {parentName}
      </span>
    )
  }

  // No derived parent and no pending: only a quiet claim entry (not a normal About field)
  if (!parentName && !pending) {
    if (!canSubmitCorrection) return null
    return (
      <>
        <div style={{ width: 1, height: 28, background: 'var(--ink-10)', margin: '0 4px' }} />
        <div style={{ padding: '4px 8px' }}>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              fontSize: 11,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            Add parent company
          </button>
          {loadError ? (
            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 4 }}>{loadError}</div>
          ) : null}
        </div>
        <OwnershipCorrectionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => void reload()}
          currentParentName={null}
        />
      </>
    )
  }

  return (
    <>
      <div style={{ width: 1, height: 28, background: 'var(--ink-10)', margin: '0 4px' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '4px 8px',
          minWidth: 140,
          maxWidth: 240,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
          }}
        >
          Parent
        </span>

        {parentName ? (
          <span style={{ fontSize: 13, color: 'var(--ink)' }}>{parentName}</span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--ink-30)', fontStyle: 'italic' }}>
            None recorded
          </span>
        )}

        {pending ? (
          <span style={{ fontSize: 11, color: 'var(--sage)', lineHeight: 1.4 }}>
            Correction submitted — under review
            <br />
            <span style={{ color: 'var(--ink-50)' }}>
              You suggested: {pendingSuggestionLabel(pending)}
            </span>
          </span>
        ) : null}

        {canSubmitCorrection ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              alignSelf: 'flex-start',
              marginTop: 2,
              fontSize: 11,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            {parentName ? 'Not right?' : 'Suggest a correction'}
          </button>
        ) : null}

        {loadError ? (
          <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{loadError}</span>
        ) : null}
      </div>

      <OwnershipCorrectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => void reload()}
        currentParentName={parentName}
      />
    </>
  )
}
