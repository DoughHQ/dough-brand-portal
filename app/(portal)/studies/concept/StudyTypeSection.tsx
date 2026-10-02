'use client'

import { useEffect, useId, useState } from 'react'
import type { ConceptStudyDraft, StimulusMode } from '@/lib/concept/types'
import { templateFieldAnchor } from '@/lib/concept/templateConfig'
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
import {
  getTaxonomyNodeAction,
  listTaxonomySiblingsAction,
  type TaxonomyNodeInfo,
} from './actions'
import CategoryCombobox from './CategoryCombobox'
import ConfirmDialog, { type ConfirmRequest } from './ConfirmDialog'
import {
  inputBase,
  labelSm,
  sectionCard,
  sectionHelp,
  sectionTitle,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
  /** Publish-time blocker for the study name, which now lives in this section. */
  titleError?: string | null
  showErrors?: boolean
  /** @deprecated Always packaging-only; kept for call-site compatibility. */
  packagingOnly?: boolean
  /** Floor for target completions. */
  minCompletions?: number
}

const LIVE_MODES = STIMULUS_MODE_OPTIONS.filter((o) => o.publishable)
const COMING_SOON_MODES = STIMULUS_MODE_OPTIONS.filter((o) => !o.publishable)

/** Common completion targets — Custom appears when the draft is off-preset. */
const COMPLETION_PRESETS = [30, 50, 100] as const

export default function StudyTypeSection({
  draft,
  onChange,
  error,
  titleError,
  showErrors,
  packagingOnly = true,
  minCompletions = 30,
}: Props) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)
  const [wordingOpen, setWordingOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [customCompletions, setCustomCompletions] = useState(
    () => !COMPLETION_PRESETS.includes(draft.targetCompletions as (typeof COMPLETION_PRESETS)[number])
  )
  const [completionsText, setCompletionsText] = useState(String(draft.targetCompletions))
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

  return (
    <section style={sectionCard} id="concept-mode" className="cb-setup">
      <h2 className="cb-section-title" style={sectionTitle}>
        Setup
      </h2>
      <p style={{ ...sectionHelp, marginBottom: 16 }}>
        Name the study, choose where it competes, and set how many responses you need.
      </p>

      {packagingOnly ? (
        <p className="cb-setup-identity" role="status">
          Packaging concept · Blind · Design letters only
        </p>
      ) : (
        <>
          <div id={studyTypeLabelId} style={{ ...labelSm, marginBottom: 12 }}>
            Study type
          </div>
          <div className="cb-mode-grid" role="radiogroup" aria-labelledby={studyTypeLabelId}>
            {liveModes.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={draft.stimulusMode === opt.value}
                className="cb-mode-card"
                onClick={() => selectMode(opt.value, opt.publishable)}
              >
                <span className="cb-mode-card-label">{opt.label}</span>
                <span className="cb-mode-card-help">{opt.help}</span>
              </button>
            ))}
          </div>

          <p className="cb-mode-roadmap">
            <span className="cb-mode-roadmap-lead">More study types coming soon</span>
            <span className="cb-mode-roadmap-list">
              {COMING_SOON_MODES.map((o) => o.label).join(' · ')}
            </span>
          </p>
        </>
      )}

      {/* Beat 2 — the decisions */}
      <div className="cb-setup-decisions">
        <div className="cb-setup-name">
          <label style={labelSm} htmlFor="concept-study-name">
            Name this study
          </label>
          <input
            id="concept-study-name"
            className="cb-input"
            value={draft.title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
            placeholder="e.g. Midnight Cocoa packaging"
            style={inputBase}
          />
          <p className="cb-field-note">Respondents see this name.</p>
          {showErrors && titleError ? (
            <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cb-error)' }}>
              {titleError}
            </p>
          ) : null}
        </div>

        <div className="cb-setup-category">
          <CategoryCombobox
            selected={node}
            pendingNodeId={hasCategory && !node ? draft.taxonomyNodeId : null}
            required={!hasCategory}
            onSelect={applyCategory}
            onClear={clearCategory}
            error={showErrors ? error : null}
          />

          {hasCategory ? (
            // The template anchor lives on a wrapper that exists whenever a category
            // does. It used to sit on the wording editor, which meant the sticky
            // footer's "Category phrasing is empty" blocker resolved to nothing while
            // the editor was collapsed — a dead anchor.
            <div id={templateFieldAnchor('category_plural')}>
              {wordingOpen ? (
                <div className="cb-wording-editor">
                  <label style={labelSm} htmlFor="category_plural_s0">
                    Questionnaire wording
                  </label>
                  <input
                    id="category_plural_s0"
                    className="cb-input"
                    value={wording}
                    onChange={(e) => setWording(e.target.value)}
                    onBlur={() => {
                      if (!wording.trim() && node) {
                        setWording(categoryPluralFromNodeName(node.node_name_display))
                      }
                    }}
                    placeholder={node ? categoryPluralFromNodeName(node.node_name_display) : 'licorice'}
                    style={{ ...inputBase, maxWidth: 360 }}
                  />
                  <p className="cb-field-note">
                    Used where a respondent question needs the category name in a sentence.
                  </p>
                  <div className="cb-wording-actions">
                    <button type="button" className="cb-quiet-action" onClick={() => setWordingOpen(false)}>
                      Close
                    </button>
                    {!isDefaultWording && node ? (
                      <button
                        type="button"
                        className="cb-quiet-action"
                        onClick={() => setWording(categoryPluralFromNodeName(node.node_name_display))}
                      >
                        Use default
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : isDefaultWording ? (
                <button
                  type="button"
                  className="cb-wording-trigger cb-quiet-action"
                  onClick={() => setWordingOpen(true)}
                >
                  Edit questionnaire wording
                </button>
              ) : (
                <p className="cb-wording-summary">
                  <span>
                    Questionnaire wording: <strong>{wording}</strong>
                  </span>
                  <button type="button" className="cb-quiet-action" onClick={() => setWordingOpen(true)}>
                    Edit
                  </button>
                </p>
              )}
            </div>
          ) : null}
        </div>

        {showReadout ? (
          <p className="cb-setup-readout" role="status">
            {[categoryLabel, titleLabel].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>

      {/* Beat 3 — how it runs (completions only; end dates deferred) */}
      <div className="cb-setup-run">
        <div className="cb-setup-run-head">
          <div className="cb-setup-run-title">How it runs</div>
          <p className="cb-setup-run-meta" role="status">
            {runMeta}
          </p>
        </div>

        <div className="cb-setup-run-body">
          <div className="cb-setup-completions">
            <div style={labelSm} id="field_target_completions_label">
              Completions
            </div>
            <div
              className="cb-setup-presets"
              role="group"
              aria-labelledby="field_target_completions_label"
            >
              {COMPLETION_PRESETS.filter((n) => n >= completionFloor).map((n) => {
                const on = !showCustomCompletions && draft.targetCompletions === n
                return (
                  <button
                    key={n}
                    type="button"
                    className={on ? 'cb-setup-preset is-on' : 'cb-setup-preset'}
                    aria-pressed={on}
                    onClick={() => {
                      setCustomCompletions(false)
                      setCompletions(n)
                    }}
                  >
                    {n}
                  </button>
                )
              })}
              <button
                type="button"
                className={showCustomCompletions ? 'cb-setup-preset is-on' : 'cb-setup-preset'}
                aria-pressed={showCustomCompletions}
                onClick={() => setCustomCompletions(true)}
              >
                Custom
              </button>
            </div>
            {showCustomCompletions ? (
              <>
                <input
                  id="field_target_completions"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  className="cb-input cb-setup-completions-input"
                  aria-labelledby="field_target_completions_label"
                  value={completionsText}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setCompletionsText(raw)
                    // Commit only once the typed count clears the floor, so
                    // typing "100" is not yanked back to 30 mid-keystroke.
                    if (raw !== '' && Number(raw) >= completionFloor) {
                      onChange({ ...draft, targetCompletions: Number(raw), fieldingDays: null })
                    }
                  }}
                  onBlur={() => {
                    if (!/^\d+$/.test(completionsText) || Number(completionsText) < completionFloor) {
                      setCompletions(Math.max(completionFloor, draft.targetCompletions || completionFloor))
                    } else {
                      setCompletions(Number(completionsText))
                    }
                  }}
                  style={{ ...inputBase, marginTop: 10, maxWidth: 160 }}
                />
                <p className="cb-field-note">Minimum {completionFloor}. Type any count.</p>
              </>
            ) : (
              <input
                id="field_target_completions"
                type="hidden"
                value={draft.targetCompletions}
                readOnly
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />
    </section>
  )
}

function buildRunMeta(completions: number): string {
  const n = Math.max(0, completions)
  return `${n} completion${n === 1 ? '' : 's'} · Runs until full`
}
