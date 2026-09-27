'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { templateFieldAnchor } from '@/lib/concept/templateConfig'
import {
  PACK_SIZE_OTHER,
  packSizeDisplayLabel,
  packSizePromptPreview,
  shouldClearPackSizeOnCategoryChange,
  type PackSizeOption,
} from '@/lib/concept/packSize'
import { getPackSizeOptionsAction } from './actions'
import { inputBase, labelSm } from './conceptStyles'

function RequiredDot() {
  return <span aria-hidden className="cb-required-dot" />
}

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
}

export default function PackSizeField({ draft, onChange }: Props) {
  const [options, setOptions] = useState<PackSizeOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [otherMode, setOtherMode] = useState(false)
  const requestGen = useRef(0)

  const nodeId = draft.taxonomyNodeId
  const packSize = draft.templateConfig.pack_size
  const phrases = options.map((o) => o.phrase)
  const trimmed = packSize.trim()
  const isKnown = trimmed.length > 0 && phrases.includes(trimmed)
  const showOther = otherMode || (trimmed.length > 0 && !isKnown && phrases.length > 0)
  const selectValue = showOther ? PACK_SIZE_OTHER : isKnown ? trimmed : ''

  useEffect(() => {
    if (nodeId == null) {
      setOptions([])
      setLoadError(false)
      setLoading(false)
      setOtherMode(false)
      return
    }
    const gen = ++requestGen.current
    setLoading(true)
    setLoadError(false)
    void getPackSizeOptionsAction(nodeId).then((res) => {
      if (gen !== requestGen.current) return
      setLoading(false)
      if (res.options.length === 0) {
        setOptions([])
        setLoadError(true)
        setOtherMode(true)
        return
      }
      setOptions(res.options)
      const nextPhrases = res.options.map((o) => o.phrase)
      if (
        shouldClearPackSizeOnCategoryChange(
          draft.templateConfig.pack_size,
          nextPhrases
        )
      ) {
        setOtherMode(false)
        onChange({
          ...draft,
          templateConfig: { ...draft.templateConfig, pack_size: '' },
        })
      } else {
        const kept = draft.templateConfig.pack_size.trim()
        setOtherMode(kept.length > 0 && !nextPhrases.includes(kept))
      }
    })
    // Only re-fetch when the category changes — not on every draft keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  function setPackSize(next: string) {
    onChange({
      ...draft,
      templateConfig: { ...draft.templateConfig, pack_size: next },
    })
  }

  function onSelectChange(value: string) {
    if (value === PACK_SIZE_OTHER) {
      setOtherMode(true)
      if (isKnown) setPackSize('')
      return
    }
    setOtherMode(false)
    setPackSize(value)
  }

  const disabled = nodeId == null

  return (
    <div id={templateFieldAnchor('pack_size')} style={{ marginTop: 24 }}>
      <label style={labelSm} htmlFor="pack_size_s0">
        {!packSize.trim() ? <RequiredDot /> : null}
        Pack size
      </label>

      <select
        id="pack_size_s0"
        className="cb-input"
        value={disabled ? '' : selectValue}
        disabled={disabled || loading}
        onChange={(e) => onSelectChange(e.target.value)}
        style={{ ...inputBase, maxWidth: 360 }}
        aria-describedby="pack_size_hint pack_size_preview"
      >
        <option value="" disabled>
          {disabled
            ? 'Pick a category first'
            : loading
              ? 'Loading pack sizes…'
              : 'Select pack size'}
        </option>
        {options.map((o) => (
          <option key={o.phrase} value={o.phrase}>
            {packSizeDisplayLabel(o.phrase)}
          </option>
        ))}
        {!disabled ? <option value={PACK_SIZE_OTHER}>Other…</option> : null}
      </select>

      {showOther && !disabled ? (
        <input
          className="cb-input"
          value={packSize}
          onChange={(e) => setPackSize(e.target.value)}
          placeholder="Describe the pack (e.g. club-size carton)"
          style={{ ...inputBase, maxWidth: 360, marginTop: 8 }}
          aria-label="Custom pack size"
          autoFocus
        />
      ) : null}

      <p id="pack_size_hint" className="cb-field-note">
        {loadError
          ? 'Could not load category pack sizes — type a custom pack size below, or re-pick the category.'
          : 'Used in respondent copy for this packaging study.'}
      </p>
      <p
        id="pack_size_preview"
        className="cb-field-note"
        style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--ink-50)' }}
      >
        {packSizePromptPreview(packSize)}
      </p>
    </div>
  )
}
