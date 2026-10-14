'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { getTaxonomyNodeAction } from '@/app/(portal)/studies/audienceActions'
import type { ConceptStudyDraft, StimulusMode } from '@/lib/concept/types'
import { STIMULUS_MODE_OPTIONS } from '@/lib/concept/constants'
import { categoryPluralFromNodeName } from '@/lib/concept/taxonomySiblings'
import {
  CATEGORY_RESET_BODY,
  categoryResetConfirmLabel,
  categoryResetLoses,
  categoryResetTitle,
  isDerivedCategoryPlural,
  modeSwitchConfirmLabel,
  modeSwitchConfirmTitle,
  planModeTransition,
  rehydrateCategoryDerived,
  titleAfterCategory,
} from '@/lib/concept/modeTransition'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import { listTaxonomySiblingsAction } from '../actions'
import type { ConfirmRequest } from '../ConfirmDialog'
import { summarizeSetup } from '@/lib/concept/builderSummaries'

const LIVE_MODES = STIMULUS_MODE_OPTIONS.filter((o) => o.publishable)

/** Common completion targets — Custom appears when the draft is off-preset. */
const COMPLETION_PRESETS = [30, 50, 100] as const

export function useStudyTypeSection({
  draft,
  onChange,
  packagingOnly = true,
  minCompletions = 30,
}: {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  packagingOnly?: boolean
  minCompletions?: number
}) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)
  const [wordingOpen, setWordingOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [customCompletions, setCustomCompletions] = useState(
    () => !COMPLETION_PRESETS.includes(draft.targetCompletions as (typeof COMPLETION_PRESETS)[number])
  )
  const [completionsText, setCompletionsText] = useState(String(draft.targetCompletions))
  const completionsFocused = useRef(false)
  const studyTypeLabelId = useId()

  // Single-test: mode is not a choice — lock packaging + blind without a picker.
  useEffect(() => {
    if (draft.stimulusMode === 'package' && draft.pricePosture === 'blind') return
    const plan = planModeTransition(draft, 'package', true)
    const next =
      plan.kind === 'noop'
        ? { ...draft, stimulusMode: 'package' as const, pricePosture: 'blind' as const }
        : { ...plan.next, pricePosture: 'blind' as const }
    onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.stimulusMode, draft.pricePosture])

  // End dates are deferred — every concept study runs until the target is full.
  useEffect(() => {
    if (draft.fieldingDays == null) return
    onChange({ ...draft, fieldingDays: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.fieldingDays])

  // Resume can replace the parent draft after this section has mounted.
  useEffect(() => {
    if (completionsFocused.current) return
    setCompletionsText(String(draft.targetCompletions))
    setCustomCompletions(
      !COMPLETION_PRESETS.includes(
        draft.targetCompletions as (typeof COMPLETION_PRESETS)[number]
      )
    )
  }, [draft.targetCompletions])

  useEffect(() => {
    if (draft.taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(draft.taxonomyNodeId).then((n) => {
      if (cancelled) return
      setNode(n)
      // Pass 1 §5/§32 — phrasing is restored at the state layer the moment the
      // node resolves, never by an operator happening to blur an input.
      const rehydrated = rehydrateCategoryDerived(draft, n?.node_name_display)
      if (rehydrated !== draft) onChange(rehydrated)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.taxonomyNodeId])

  function selectMode(mode: StimulusMode, publishable: boolean) {
    const plan = planModeTransition(draft, mode, publishable)
    if (plan.kind === 'noop') return
    // Pass 1 §16 — the plan is inert. Opening the dialog mutates nothing; only
    // confirming applies it.
    if (plan.kind === 'confirm') {
      setConfirm({
        title: modeSwitchConfirmTitle(mode),
        body: plan.message,
        confirmLabel: modeSwitchConfirmLabel(mode),
        onConfirm: () => onChange(plan.next),
      })
      return
    }
    onChange(plan.next)
  }

  async function commitCategory(n: TaxonomyNodeInfo) {
    const siblings = await listTaxonomySiblingsAction(n.taxonomy_node_id)
    setNode(n)
    setWordingOpen(false)
    onChange({
      ...draft,
      taxonomyNodeId: n.taxonomy_node_id,
      title: titleAfterCategory(draft.title, node?.node_name_display, n.node_name_display),
      templateConfig: {
        ...draft.templateConfig,
        category_plural: categoryPluralFromNodeName(n.node_name_display),
        legibility_options: siblings.sparse ? [] : siblings.preselected,
      },
    })
  }

  function applyCategory(n: TaxonomyNodeInfo) {
    const changing =
      draft.taxonomyNodeId != null && draft.taxonomyNodeId !== n.taxonomy_node_id
    if (changing && categoryResetLoses(draft.templateConfig, node?.node_name_display)) {
      setConfirm({
        title: categoryResetTitle('change'),
        body: CATEGORY_RESET_BODY,
        confirmLabel: categoryResetConfirmLabel('change'),
        onConfirm: () => void commitCategory(n),
      })
      return
    }
    void commitCategory(n)
  }

  function commitClearCategory() {
    setNode(null)
    setWordingOpen(false)
    onChange({
      ...draft,
      taxonomyNodeId: null,
      title: titleAfterCategory(draft.title, node?.node_name_display, null),
      templateConfig: {
        ...draft.templateConfig,
        category_plural: '',
        legibility_options: [],
      },
    })
  }

  function clearCategory() {
    if (categoryResetLoses(draft.templateConfig, node?.node_name_display)) {
      setConfirm({
        title: categoryResetTitle('clear'),
        body: CATEGORY_RESET_BODY,
        confirmLabel: categoryResetConfirmLabel('clear'),
        onConfirm: commitClearCategory,
      })
      return
    }
    commitClearCategory()
  }

  function setWording(value: string) {
    onChange({
      ...draft,
      templateConfig: { ...draft.templateConfig, category_plural: value },
    })
  }

  // Pass 1 §32 — no persisted flag. A value equal to what the node derives is
  // treated as the default; anything else is the operator's own.
  const wording = draft.templateConfig.category_plural
  const isDefaultWording = isDerivedCategoryPlural(wording, node?.node_name_display)

  // Visibility follows the draft, which is known synchronously; the taxonomy
  // fetch only enriches the name and breadcrumb.
  const hasCategory = draft.taxonomyNodeId != null
  const liveModes = packagingOnly
    ? LIVE_MODES.filter((o) => o.value === 'package')
    : LIVE_MODES
  const completionFloor = Math.max(1, minCompletions)

  function setCompletions(n: number) {
    const next = Math.max(completionFloor, n)
    setCompletionsText(String(next))
    onChange({
      ...draft,
      targetCompletions: next,
      fieldingDays: null,
    })
  }

  const onPreset = COMPLETION_PRESETS.includes(
    draft.targetCompletions as (typeof COMPLETION_PRESETS)[number]
  )
  const showCustomCompletions = customCompletions || !onPreset

  const categoryLabel = node?.node_name_display?.trim() || null
  const titleLabel = draft.title.trim() || null
  const showReadout = !!(categoryLabel || titleLabel)

  const runMeta = buildRunMeta(draft.targetCompletions)
  const sectionDone = draft.taxonomyNodeId != null && !!draft.title.trim()
  const setupSummary = summarizeSetup(draft)

  return {
    node,
    wordingOpen,
    setWordingOpen,
    confirm,
    setConfirm,
    completionsText,
    setCompletionsText,
    completionsFocused,
    studyTypeLabelId,
    selectMode,
    applyCategory,
    clearCategory,
    setWording,
    wording,
    isDefaultWording,
    hasCategory,
    liveModes,
    completionPresets: COMPLETION_PRESETS,
    completionFloor,
    setCompletions,
    setCustomCompletions,
    showCustomCompletions,
    categoryLabel,
    titleLabel,
    showReadout,
    runMeta,
    sectionDone,
    setupSummary,
  }
}

function buildRunMeta(completions: number): string {
  const n = Math.max(0, completions)
  return `${n} completion${n === 1 ? '' : 's'} · Runs until full · up to 90 days`
}
