'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import {
  defaultSuccessBarsDraft,
  fieldAnswerOptionSeats,
  syncBrandQuestionFieldOptions,
  type SuccessBarsDraft,
} from '@/lib/concept/singleTest'
import type { PhonePreviewJourney } from '@/lib/concept/journey'
import {
  customBattlePromptNote,
  journeyAsked,
  journeyClosedLine,
  pairedScreenerCountLabel,
  whyFollowupAsked,
  type JourneyStepId,
} from '@/lib/concept/journeyAccordion'
import {
  checkConceptDecoyAction,
  previewConceptJourneyAction,
} from '../actions'
import { initialJourneyOpen } from './journeyLabels'

export function useSingleTestJourney({
  draft,
  onChange,
}: {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
}) {
  const config = draft.templateConfig
  const bars = draft.successBars ?? defaultSuccessBarsDraft()
  const [journey, setJourney] = useState<PhonePreviewJourney | null>(null)
  const [journeyError, setJourneyError] = useState<string | null>(null)
  const [decoyHint, setDecoyHint] = useState<string | null>(null)
  const [openKey, setOpenKey] = useState<string | null>(() => initialJourneyOpen(draft))
  const rowRefs = useRef<Partial<Record<JourneyStepId, HTMLElement | null>>>({})

  const fieldErrors = useMemo(() => {
    const m = new Map<string, string>()
    return m
  }, [])

  function patchConfig(partial: Partial<typeof config>) {
    onChange({ ...draft, templateConfig: { ...config, ...partial } })
  }

  function patchBars(next: SuccessBarsDraft) {
    onChange({ ...draft, successBars: next })
  }

  const loadJourney = useCallback(async () => {
    const result = await previewConceptJourneyAction(draft)
    if (result.preview) {
      setJourney(result.preview)
      setJourneyError(result.ok ? null : result.error)
      return
    }
    setJourney(null)
    setJourneyError(result.ok ? null : result.error)
  }, [draft])

  useEffect(() => {
    void loadJourney()
  }, [
    draft.taxonomyNodeId,
    draft.templateConfig,
    draft.conceptArms.length,
    draft.products.length,
    draft.battlePromptCode,
    draft.customBattlePrompt,
    draft.brandQuestions,
    loadJourney,
  ])

  useEffect(() => {
    const decoy = config.decoy_option.trim()
    if (decoy.length < 2) {
      setDecoyHint(null)
      return
    }
    const t = setTimeout(() => {
      void checkConceptDecoyAction(decoy).then((r) => {
        if (!r.ok) setDecoyHint(r.reason)
        else setDecoyHint(null)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [config.decoy_option])

  const customPrompt = (draft.customBattlePrompt ?? '').trim()
  const usingCustom = customPrompt.length > 0
  const customNote = customBattlePromptNote(draft.customBattlePrompt ?? '')
  const brandQuestions = draft.brandQuestions ?? []
  const fieldSeats = useMemo(
    () =>
      fieldAnswerOptionSeats({
        conceptArms: draft.conceptArms,
        products: draft.products,
      }),
    [draft.conceptArms, draft.products]
  )
  const fieldOptions = useMemo(
    () => fieldSeats.map((seat) => seat.label),
    [fieldSeats]
  )

  // Keep Choose-from-field questions aligned with the live field seats.
  useEffect(() => {
    let changed = false
    const next = brandQuestions.map((question) => {
      const synced = syncBrandQuestionFieldOptions(question, fieldOptions)
      if (synced !== question) changed = true
      return synced
    })
    if (changed) onChange({ ...draft, brandQuestions: next })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when field seats change
  }, [fieldOptions])

  const counts = journey?.counts ?? null
  const screens = journey?.screens
  const lineFor = (id: JourneyStepId) => journeyClosedLine(id, draft, screens)
  const askedFor = (id: JourneyStepId) => journeyAsked(id, draft, screens)

  function toggleStep(id: string) {
    setOpenKey((current) => (current === id ? null : id))
  }

  function bindRow(id: JourneyStepId) {
    return (node: HTMLElement | null) => {
      rowRefs.current[id] = node
    }
  }

  return {
    config,
    bars,
    journey,
    journeyError,
    decoyHint,
    openKey,
    setOpenKey,
    fieldErrors,
    patchConfig,
    patchBars,
    usingCustom,
    customNote,
    brandQuestions,
    fieldSeats,
    fieldOptions,
    howOften: askedFor('screeners')[0],
    boughtLately: askedFor('screeners')[1],
    why: whyFollowupAsked(screens),
    screenerCount: pairedScreenerCountLabel(counts),
    brandStart: 9,
    counts,
    lineFor,
    askedFor,
    toggleStep,
    bindRow,
  }
}
