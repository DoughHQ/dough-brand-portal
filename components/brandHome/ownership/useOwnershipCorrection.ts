import { useEffect, useMemo, useState } from 'react'
import {
  fetchActiveConglomerates,
  OwnershipCorrectionError,
  submitBrandOwnershipCorrection,
  type ConglomerateOption,
} from '@/lib/brandHome/brandOwnershipPortal'
import type { Mode } from './ownershipModel'

export type OwnershipCorrectionState = ReturnType<typeof useOwnershipCorrection>

export function useOwnershipCorrection({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  onSubmitted: () => void
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

  return {
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
  }
}
