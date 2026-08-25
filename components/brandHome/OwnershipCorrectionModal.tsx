'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  fetchActiveConglomerates,
  OwnershipCorrectionError,
  submitBrandOwnershipCorrection,
  type ConglomerateOption,
} from '@/lib/brandHome/brandOwnershipPortal'

type Mode = 'has_parent' | 'independent'

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
  const [mode, setMode] = useState<Mode>('has_parent')
  const [options, setOptions] = useState<ConglomerateOption[]>([])
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ConglomerateOption | null>(null)
  const [notes, setNotes] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('has_parent')
    setQuery('')
    setSelected(null)
    setNotes('')
    setEvidenceUrl('')
    setError(null)
    setOptionsError(null)
    setLoadingOptions(true)
    void fetchActiveConglomerates()
      .then((rows) => {
        if (rows.length === 0) {
          setOptionsError(
            'No companies available to pick from. Stop and contact support — the conglomerates list returned empty.'
          )
        }
        setOptions(rows)
      })
      .catch((err) => {
        setOptionsError(
          err instanceof OwnershipCorrectionError
            ? err.message
            : 'Couldn’t load company list. Try again.'
        )
      })
      .finally(() => setLoadingOptions(false))
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 40)
    return options.filter((o) => o.display_name.toLowerCase().includes(q)).slice(0, 40)
  }, [options, query])

  if (!open) return null

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      if (mode === 'has_parent') {
        if (!selected) {
          setError('Pick a parent company from the list.')
          setSaving(false)
          return
        }
        await submitBrandOwnershipCorrection({
          assertionType: 'has_parent',
          assertedConglomerateId: selected.conglomerate_id,
          userNotes: notes.slice(0, 2000) || null,
          evidenceUrl: evidenceUrl.trim() || null,
        })
      } else {
        await submitBrandOwnershipCorrection({
          assertionType: 'independent',
          assertedConglomerateId: null,
          userNotes: notes.slice(0, 2000) || null,
          evidenceUrl: evidenceUrl.trim() || null,
        })
      }
      onSubmitted()
      onClose()
    } catch (err) {
      setError(
        err instanceof OwnershipCorrectionError
          ? err.message
          : 'Couldn’t submit your correction. Try again.'
      )
    } finally {
      setSaving(false)
    }
  }

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
          background: 'var(--white, #fff)',
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
            ? `Currently recorded as ${currentParentName}. Your suggestion goes to Dough for review — the displayed parent won’t change until it’s accepted.`
            : 'No parent is currently recorded. Suggest a parent company, or confirm this brand is independent. Dough will review before anything changes.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--ink)',
            }}
          >
            <input
              type="radio"
              name="ownership-mode"
              checked={mode === 'has_parent'}
              onChange={() => setMode('has_parent')}
              style={{ marginTop: 3 }}
            />
            <span>This brand’s parent company is…</span>
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--ink)',
            }}
          >
            <input
              type="radio"
              name="ownership-mode"
              checked={mode === 'independent'}
              onChange={() => {
                setMode('independent')
                setSelected(null)
                setQuery('')
              }}
              style={{ marginTop: 3 }}
            />
            <span>This brand is independent (no parent company)</span>
          </label>
        </div>

        {mode === 'has_parent' ? (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink-30)',
                marginBottom: 6,
              }}
            >
              Parent company
            </div>
            {loadingOptions ? (
              <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>Loading companies…</div>
            ) : optionsError ? (
              <div style={{ fontSize: 13, color: 'var(--red, #b42318)' }}>{optionsError}</div>
            ) : (
              <>
                <input
                  value={selected ? selected.display_name : query}
                  onChange={(e) => {
                    setSelected(null)
                    setQuery(e.target.value)
                  }}
                  placeholder="Search companies…"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--ink-10)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--ink)',
                    outline: 'none',
                  }}
                />
                {!selected && query.trim().length > 0 ? (
                  <div
                    style={{
                      marginTop: 4,
                      maxHeight: 180,
                      overflow: 'auto',
                      border: '1px solid var(--ink-10)',
                      borderRadius: 6,
                      background: 'var(--white)',
                    }}
                  >
                    {filtered.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ink-30)' }}>
                        No matches
                      </div>
                    ) : (
                      filtered.map((o) => (
                        <button
                          key={o.conglomerate_id}
                          type="button"
                          onClick={() => {
                            setSelected(o)
                            setQuery(o.display_name)
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid var(--mist, var(--ink-10))',
                            background: 'transparent',
                            fontSize: 13,
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {o.display_name}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
                {selected ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null)
                      setQuery('')
                    }}
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: 'var(--ink-30)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Clear selection
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 6,
            }}
          >
            Notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
            rows={3}
            placeholder="Anything that helps us verify this…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--ink-10)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--ink)',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.5,
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 4, textAlign: 'right' }}>
            {notes.length}/2000
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 6,
            }}
          >
            Evidence URL <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
          </div>
          <input
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px',
              borderRadius: 6,
              border: '1px solid var(--ink-10)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
        </div>

        {error ? (
          <div style={{ fontSize: 12, color: 'var(--red, #b42318)', marginBottom: 12 }}>{error}</div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid var(--ink-10)',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--ink-50)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || Boolean(optionsError) || (mode === 'has_parent' && loadingOptions)}
            style={{
              padding: '8px 14px',
              background: 'var(--sage)',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Submitting…' : 'Submit correction'}
          </button>
        </div>
      </div>
    </div>
  )
}
