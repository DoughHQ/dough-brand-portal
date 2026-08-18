'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ConceptStudyDraft,
  LegibilityOption,
  PackagingTemplateConfig,
} from '@/lib/concept/types'
import {
  NOT_SURE,
  editableLegibilityOptions,
  taxLegibilityOption,
  templateFieldAnchor,
  validatePackagingTemplateConfig,
} from '@/lib/concept/templateConfig'
import { seedLegibilityOptionsAction } from './actions'
import {
  Chip,
  ExpectedPriceCard,
  QCard,
  VerificationCard,
} from './conceptCards'
import {
  labelSm,
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  disabled?: boolean
  disabledReason?: string | null
  error?: string | null
}

export default function PackagingQuestionnaireEditor({
  draft,
  onChange,
  disabled,
  error,
}: Props) {
  const config = draft.templateConfig
  const categoryReady = draft.taxonomyNodeId != null
  const locked = !!disabled || !categoryReady

  const fieldErrors = validatePackagingTemplateConfig(config)
  const errorByField = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of fieldErrors) m.set(e.field, e.message)
    return m
  }, [fieldErrors])

  const [available, setAvailable] = useState<LegibilityOption[]>([])
  const [sparse, setSparse] = useState(false)
  const seededLegibilityFor = useRef<number | null>(null)

  const legibilityEditable = editableLegibilityOptions(config)

  function patchConfig(partial: Partial<PackagingTemplateConfig>) {
    onChange({
      ...draft,
      templateConfig: { ...config, ...partial },
    })
  }

  useEffect(() => {
    if (draft.taxonomyNodeId == null) {
      setAvailable([])
      setSparse(false)
      return
    }
    let cancelled = false
    void seedLegibilityOptionsAction(draft.taxonomyNodeId).then((result) => {
      if (cancelled) return
      setAvailable(result.available)
      setSparse(result.sparse)
      if (
        seededLegibilityFor.current !== draft.taxonomyNodeId &&
        editableLegibilityOptions(draft.templateConfig).length === 0 &&
        !result.sparse &&
        result.suggested.length > 0
      ) {
        seededLegibilityFor.current = draft.taxonomyNodeId
        onChange({
          ...draft,
          templateConfig: {
            ...draft.templateConfig,
            legibility_options: [...result.suggested],
          },
        })
      } else {
        seededLegibilityFor.current = draft.taxonomyNodeId
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed on node change
  }, [draft.taxonomyNodeId])

  function toggleLegibility(opt: LegibilityOption) {
    if (!('taxonomy_node_id' in opt)) return
    const selected = legibilityEditable.some(
      (x) => x.taxonomy_node_id === opt.taxonomy_node_id
    )
    const next = selected
      ? legibilityEditable.filter((x) => x.taxonomy_node_id !== opt.taxonomy_node_id)
      : [
          ...legibilityEditable,
          taxLegibilityOption(opt.taxonomy_node_id, opt.label),
        ]
    patchConfig({ legibility_options: next })
  }

  return (
    <section style={sectionCard} id="concept-questions">
      <div style={sectionEyebrow}>Section 2 · Questionnaire</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Questionnaire
      </h2>
      <p style={sectionHelp}>
        Customize what respondents will see — battles, price, category read, then purchase
        verification.
      </p>

      {locked ? (
        <div className="cb-locked-panel" role="status">
          <strong>Choose a category to continue</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, maxWidth: 480 }}>
            We&apos;ll seed category-read options and purchase-verification suggestions after
            you select one.
          </p>
        </div>
      ) : null}

      {!locked ? (
        <>
          <QCard
            title="Battles"
            help="Pairwise taste battles are system-managed from your field. Respondents see “Which one are you buying?”"
          >
            <div
              style={{
                padding: '16px 16px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface-1)',
                border: '1px solid var(--ink-10)',
                fontSize: 13,
                color: 'var(--ink-50)',
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                System-managed
              </div>
              Rounds and pairings come from your field size and battle settings in Section 1.
              No questionnaire edits here.
            </div>
          </QCard>

          <ExpectedPriceCard
            config={config}
            patchConfig={patchConfig}
            errorByField={errorByField}
          />

          <QCard
            id={templateFieldAnchor('legibility_options')}
            title="Category Legibility"
            help="Plausible category confusions — sibling categories from your taxonomy."
          >
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...labelSm, marginBottom: 8 }}>Available</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {available.map((opt) => {
                  if (!('taxonomy_node_id' in opt)) return null
                  const selected = legibilityEditable.some(
                    (x) => x.taxonomy_node_id === opt.taxonomy_node_id
                  )
                  return (
                    <Chip
                      key={opt.id}
                      label={opt.label}
                      selected={selected}
                      onToggle={() => toggleLegibility(opt)}
                    />
                  )
                })}
                {available.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
                    {sparse
                      ? 'Few sibling categories in this branch — pick every available confusion, or choose a denser category.'
                      : 'No sibling categories to pick from in this branch.'}
                  </span>
                ) : null}
              </div>
            </div>
            <div>
              <div style={{ ...labelSm, marginBottom: 8 }}>Selected</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {legibilityEditable.map((opt) => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    tone="sage"
                    removable
                    onRemove={() => toggleLegibility(opt)}
                  />
                ))}
                <Chip label={NOT_SURE} tone="muted" locked />
              </div>
              {errorByField.get('legibility_options') ? (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>
                  {errorByField.get('legibility_options')}
                </p>
              ) : null}
            </div>
          </QCard>

          <VerificationCard
            config={config}
            patchConfig={patchConfig}
            errorByField={errorByField}
          />

          {error ? (
            <p role="alert" style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--red)' }}>
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
