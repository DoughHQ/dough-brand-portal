'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import {
  PACK_SIZE_OTHER,
  shouldClearPackSizeOnCategoryChange,
  type PackSizeOption,
} from '@/lib/concept/packSize'
import { getPackSizeOptionsAction } from '../conceptCatalogActions'

export function usePackSizeField(
  draft: ConceptStudyDraft,
  onChange: (next: ConceptStudyDraft) => void,
) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when the category changes, not on every draft keystroke
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

  return {
    options,
    loading,
    loadError,
    packSize,
    showOther,
    selectValue,
    disabled,
    setPackSize,
    onSelectChange,
  }
}
