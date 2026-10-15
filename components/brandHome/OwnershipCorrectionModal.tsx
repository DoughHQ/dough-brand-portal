'use client'

import { PRODUCT_NAME } from '@/lib/brand'
import { EvidenceField } from './ownership/EvidenceField'
import { NotesField } from './ownership/NotesField'
import { OwnershipActions } from './ownership/OwnershipActions'
import { OwnershipModeChoice } from './ownership/OwnershipModeChoice'
import { ParentPicker } from './ownership/ParentPicker'
import { useOwnershipCorrection } from './ownership/useOwnershipCorrection'

export default function OwnershipCorrectionModal({
  open,
  onClose,
  onSubmitted,
  currentParentName,
}: {
  open: boolean
  onClose: () => void
  onSubmitted: () => void
  currentParentName: string | null
}) {
  const {
    mode,
    setMode,
    optionsError,
    loadingOptions,
    query,
    setQuery,
    selected,
    setSelected,
    notes,
    setNotes,
    evidenceUrl,
    setEvidenceUrl,
    saving,
    error,
    filtered,
    submit,
  } = useOwnershipCorrection({ open, onClose, onSubmitted })

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ownership-correction-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(20, 24, 20, 0.35)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--paper)',
          borderRadius: 12,
          border: '1px solid var(--ink-10)',
          padding: '24px 24px 20px',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="ownership-correction-title"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 400,
            margin: '0 0 6px',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          Suggest a parent correction
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '0 0 18px', lineHeight: 1.5 }}>
          {currentParentName
            ? `Currently recorded as ${currentParentName}. Your suggestion goes to ${PRODUCT_NAME} for review — the displayed parent won’t change until it’s accepted.`
            : `No parent is currently recorded. Suggest a parent company, or confirm this brand is independent. ${PRODUCT_NAME} will review before anything changes.`}
        </p>

        <OwnershipModeChoice
          mode={mode}
          setMode={setMode}
          setSelected={setSelected}
          setQuery={setQuery}
        />

        {mode === 'has_parent' ? (
          <ParentPicker
            loadingOptions={loadingOptions}
            optionsError={optionsError}
            selected={selected}
            setSelected={setSelected}
            query={query}
            setQuery={setQuery}
            filtered={filtered}
          />
        ) : null}

        <NotesField notes={notes} setNotes={setNotes} />

        <EvidenceField evidenceUrl={evidenceUrl} setEvidenceUrl={setEvidenceUrl} />

        <OwnershipActions
          onClose={onClose}
          error={error}
          saving={saving}
          optionsError={optionsError}
          mode={mode}
          loadingOptions={loadingOptions}
          submit={submit}
        />
      </div>
    </div>
  )
}
