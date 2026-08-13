'use client'

import { useEffect, useState } from 'react'
import type { ConceptStudyDraft, StimulusMode } from '@/lib/concept/types'
import {
  editableLegibilityOptions,
  templateFieldAnchor,
} from '@/lib/concept/templateConfig'
import {
  MODE_IN_PROGRESS_NOTE,
  STIMULUS_MODE_OPTIONS,
} from '@/lib/concept/constants'
import { emptyPackagingTemplateConfig } from '@/lib/concept/defaults'
import { categoryPluralFromNodeName } from '@/lib/concept/taxonomySiblings'
import {
  getTaxonomyNodeAction,
  listTaxonomySiblingsAction,
  type TaxonomyNodeInfo,
} from './actions'
import CategoryCombobox from './CategoryCombobox'
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
  showErrors?: boolean
}

const AMBER = '#9A5F12'

export default function StudyTypeSection({
  draft,
  onChange,
  error,
  showErrors,
}: Props) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)

  useEffect(() => {
    if (draft.taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(draft.taxonomyNodeId).then((n) => {
      if (!cancelled) setNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [draft.taxonomyNodeId])

  function selectMode(mode: StimulusMode, publishable: boolean) {
    if (!publishable) return
    if (draft.stimulusMode === mode) return
    const enteringBlindImageMode =
      (mode === 'package' || mode === 'price') && draft.stimulusMode !== mode
    // Standalone price = one own product. Cap on entry; composition will lift this.
    const baseArms =
      mode === 'price' ? draft.conceptArms.slice(0, 1) : draft.conceptArms
    onChange({
      ...draft,
      stimulusMode: mode,
      sessionCount: 1,
      ...(enteringBlindImageMode
        ? {
            pricePosture: 'blind' as const,
            conceptArms: baseArms.map((a) => ({ ...a, frozen_price: null })),
            products: draft.products.map((p) => ({ ...p, frozen_price: null })),
            templateConfig: emptyPackagingTemplateConfig(),
          }
        : {
            conceptArms: baseArms,
            templateConfig: draft.templateConfig,
          }),
    })
  }

  async function applyCategory(n: TaxonomyNodeInfo) {
    const derived = categoryPluralFromNodeName(n.node_name_display)
    const currentDerived = node
      ? categoryPluralFromNodeName(node.node_name_display)
      : ''
    const phrasingEdited =
      !!draft.templateConfig.category_plural.trim() &&
      draft.templateConfig.category_plural.trim() !== currentDerived
    const legibilityEdited =
      editableLegibilityOptions(draft.templateConfig).length > 0

    if (
      draft.taxonomyNodeId != null &&
      draft.taxonomyNodeId !== n.taxonomy_node_id &&
      (phrasingEdited || legibilityEdited)
    ) {
      const ok = window.confirm(
        'Changing category will reset category phrasing and legibility options. Continue?'
      )
      if (!ok) return
    }

    const siblings = await listTaxonomySiblingsAction(n.taxonomy_node_id)
    setNode(n)

    onChange({
      ...draft,
      taxonomyNodeId: n.taxonomy_node_id,
      templateConfig: {
        ...draft.templateConfig,
        category_plural: derived,
        legibility_options: siblings.sparse ? [] : siblings.preselected,
      },
    })
  }

  function clearCategory() {
    setNode(null)
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

  return (
    <section style={sectionCard} id="concept-mode">
      <div style={sectionEyebrow}>Section 0 · Setup</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        What are you testing?
      </h2>
      <p style={sectionHelp}>
        Choose the study type and category before building the field.
      </p>

      <div style={{ ...labelSm, marginBottom: 10 }}>Study type</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {STIMULUS_MODE_OPTIONS.map((opt) => {
          const active = draft.stimulusMode === opt.value
          const disabled = !opt.publishable
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              title={disabled ? MODE_IN_PROGRESS_NOTE : opt.help}
              onClick={() => selectMode(opt.value, opt.publishable)}
              style={{
                textAlign: 'left',
                border: active
                  ? '1px solid var(--sage)'
                  : '1px solid var(--ink-10)',
                background: active
                  ? 'var(--sage-soft)'
                  : disabled
                    ? 'var(--surface-1)'
                    : 'var(--white)',
                borderRadius: 'var(--cb-radius-card)',
                padding: '14px 14px 12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.72 : 1,
                minHeight: 96,
                transition: 'background 120ms ease, border-color 120ms ease',
              }}
              onMouseEnter={(e) => {
                if (disabled || active) return
                e.currentTarget.style.background = 'var(--cb-sage-hover, rgba(62,107,74,0.08))'
                e.currentTarget.style.borderColor = 'var(--sage)'
              }}
              onMouseLeave={(e) => {
                if (disabled || active) return
                e.currentTarget.style.background = 'var(--white)'
                e.currentTarget.style.borderColor = 'var(--ink-10)'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: disabled ? 'var(--ink-30)' : 'var(--ink-80)',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {opt.label}
                {opt.publishable ? (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: active ? 'var(--sage)' : 'var(--ink-30)',
                    }}
                  >
                    Live
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: disabled ? 'var(--ink-30)' : 'var(--ink-50)',
                  lineHeight: 1.4,
                }}
              >
                {disabled ? MODE_IN_PROGRESS_NOTE : opt.help}
              </div>
            </button>
          )
        })}
      </div>

      <CategoryCombobox
        selected={node}
        required={!draft.taxonomyNodeId}
        onSelect={(n) => void applyCategory(n)}
        onClear={clearCategory}
        error={showErrors ? error : null}
      />

      {node ? (
        <div style={{ marginTop: 18 }}>
          <label style={labelSm} htmlFor="category_plural_s0">
            Category phrasing
          </label>
          <input
            id="category_plural_s0"
            className="cb-input"
            value={draft.templateConfig.category_plural}
            onChange={(e) => {
              const v = e.target.value
              onChange({
                ...draft,
                templateConfig: {
                  ...draft.templateConfig,
                  category_plural: v,
                },
              })
            }}
            onBlur={() => {
              if (!draft.templateConfig.category_plural.trim() && node) {
                onChange({
                  ...draft,
                  templateConfig: {
                    ...draft.templateConfig,
                    category_plural: categoryPluralFromNodeName(node.node_name_display),
                  },
                })
              }
            }}
            placeholder="licorice"
            style={inputBase}
          />
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-50)' }}>
            Prefills as lowercase category name — edit only for phrasing.
          </p>

          {draft.stimulusMode === 'package' ? (
            <div id={templateFieldAnchor('pack_size')} style={{ marginTop: 16 }}>
              <label style={labelSm} htmlFor="pack_size_s0">
                {!draft.templateConfig.pack_size.trim() ? (
                  <span
                    aria-hidden
                    style={{
                      display: 'inline-block',
                      width: 7,
                      height: 7,
                      borderRadius: 'var(--cb-radius-pill)',
                      background: AMBER,
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                ) : null}
                Pack size
              </label>
              <input
                id="pack_size_s0"
                className="cb-input"
                value={draft.templateConfig.pack_size}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    templateConfig: {
                      ...draft.templateConfig,
                      pack_size: e.target.value,
                    },
                  })
                }
                placeholder="e.g. 4-pack, pint, 12 oz"
                style={inputBase}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-50)' }}>
                Used in respondent copy for this packaging study.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
