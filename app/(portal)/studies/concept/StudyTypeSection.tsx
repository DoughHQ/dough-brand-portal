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
  sectionEyebrow,
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
}

/** Required-and-empty marker. One token, one radius, every field. */
function RequiredDot() {
  return <span aria-hidden className="cb-required-dot" />
}

// Derived from the same constant the domain uses, so the roadmap can never
// drift from the real mode definitions and no name is written twice.
const LIVE_MODES = STIMULUS_MODE_OPTIONS.filter((o) => o.publishable)
const COMING_SOON_MODES = STIMULUS_MODE_OPTIONS.filter((o) => !o.publishable)

export default function StudyTypeSection({
  draft,
  onChange,
  error,
  titleError,
  showErrors,
}: Props) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)
  const [wordingOpen, setWordingOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const studyTypeLabelId = useId()

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
  const packagingMode = draft.stimulusMode === 'package'

  return (
    <section style={sectionCard} id="concept-mode">
      <div style={sectionEyebrow}>Section 0 · Setup</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Set up the study
      </h2>
      <p style={sectionHelp}>
        Name the study, choose what you&rsquo;re testing, and select the category.
      </p>

      {/* 1 — name it */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelSm} htmlFor="concept-study-name">
          Study name
        </label>
        <input
          id="concept-study-name"
          className="cb-input"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="e.g. Midnight snack concept — Q3"
          style={inputBase}
        />
        {showErrors && titleError ? (
          <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cb-error)' }}>
            {titleError}
          </p>
        ) : null}
      </div>

      {/* 2 — what are we testing */}
      <div id={studyTypeLabelId} style={{ ...labelSm, marginBottom: 12 }}>
        Study type
      </div>
      <div className="cb-mode-grid" role="radiogroup" aria-labelledby={studyTypeLabelId}>
        {LIVE_MODES.map((opt) => (
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

      {/* Information, not a control — outside the radiogroup on purpose. */}
      <p className="cb-mode-roadmap">
        <span className="cb-mode-roadmap-lead">More study types coming soon</span>
        <span className="cb-mode-roadmap-list">
          {COMING_SOON_MODES.map((o) => o.label).join(' · ')}
        </span>
      </p>

      {/* 3 — where does it compete */}
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
          {/* Questionnaire wording is an override, not a form field. The derived
              value is correct by default, so it stays implicit until asked for. */}
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
                {/* Edits land on the draft as they are typed, so this only
                    collapses the editor. "Close" says that; "Done" implied a save. */}
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
            // A custom override is never hidden behind a bare link.
            <p className="cb-wording-summary">
              <span>
                Questionnaire wording: <strong>{wording}</strong>
              </span>
              <button type="button" className="cb-quiet-action" onClick={() => setWordingOpen(true)}>
                Edit
              </button>
            </p>
          )}

          {/* 4 — mode-specific setup */}
          {packagingMode ? (
            <div id={templateFieldAnchor('pack_size')} style={{ marginTop: 24 }}>
              <label style={labelSm} htmlFor="pack_size_s0">
                {!draft.templateConfig.pack_size.trim() ? <RequiredDot /> : null}
                Pack size
              </label>
              <input
                id="pack_size_s0"
                className="cb-input"
                value={draft.templateConfig.pack_size}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    templateConfig: { ...draft.templateConfig, pack_size: e.target.value },
                  })
                }
                placeholder="e.g. 4-pack, pint, 12 oz"
                style={{ ...inputBase, maxWidth: 360 }}
              />
              <p className="cb-field-note">Used in respondent copy for this packaging study.</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />
    </section>
  )
}
