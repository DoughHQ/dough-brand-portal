'use client'

import { useMemo } from 'react'
import type {
  ConceptStudyDraft,
  PackagingTemplateConfig,
} from '@/lib/concept/types'
import { validateConceptTemplateConfig } from '@/lib/concept/templateConfig'
import {
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
} from './conceptStyles'
import {
  ExpectedPriceCard,
  QCard,
  VerificationCard,
} from './conceptCards'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  disabled?: boolean
  disabledReason?: string | null
  error?: string | null
}

/**
 * Price module — blind price discovery. Two system-managed instruments
 * (perceived-premium battles + per-arm willingness-to-pay) plus the two
 * operator inputs it shares with packaging: the expected-price anchor and
 * the purchase-verification screener. No legibility, no pack size, no audience.
 * Posture is forced blind (set on mode entry in StudyTypeSection) — there is
 * intentionally no posture control here.
 */
export default function PriceQuestionnaireEditor({
  draft,
  onChange,
  disabled,
  error,
}: Props) {
  const config = draft.templateConfig
  const categoryReady = draft.taxonomyNodeId != null
  const locked = !!disabled || !categoryReady

  const fieldErrors = validateConceptTemplateConfig(config, 'price')
  const errorByField = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of fieldErrors) m.set(e.field, e.message)
    return m
  }, [fieldErrors])

  function patchConfig(partial: Partial<PackagingTemplateConfig>) {
    onChange({ ...draft, templateConfig: { ...config, ...partial } })
  }

  return (
    <section style={sectionCard} id="concept-questions">
      <div style={sectionEyebrow}>Section 2 · Questionnaire</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Questionnaire
      </h2>
      <p style={sectionHelp}>
        A blind price study: shoppers never see a price. First they judge which
        design looks more expensive, then they say what each is worth to them.
      </p>

      {/* Blind explainer */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          padding: '12px 14px',
          marginBottom: 18,
          borderRadius: 'var(--r-sm)',
          background: 'var(--sage-soft)',
          border: '1px solid var(--ink-10)',
        }}
      >
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1.3 }}>
          ●
        </span>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
          <strong>Prices stay hidden throughout.</strong> No price appears on any
          design or question — so shoppers reveal what they’d genuinely pay, rather
          than reacting to a number you gave them.
        </p>
      </div>

      {locked ? (
        <div className="cb-locked-panel" role="status">
          <strong>Choose a category to continue</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, maxWidth: 480 }}>
            We’ll seed purchase-verification suggestions once you select one.
          </p>
        </div>
      ) : (
        <>
          {/* Sub-instrument 1: perceived-premium battles (system-managed) */}
          <QCard
            title="Perceived-premium battles"
            locked
            lockLabel="SYSTEM-MANAGED"
            help="Respondents see two designs side by side and pick which one looks like it costs more. Blind, forced-choice — pairings come from your field in Section 1. This is where the product’s perceived price position comes from."
          />

          {/* Expected price anchor (shared card, reframed copy) */}
          <ExpectedPriceCard
            config={config}
            patchConfig={patchConfig}
            errorByField={errorByField}
            labelOverride="Expected retail price"
            helpOverride="Roughly what will this retail for? We generate the willingness-to-pay scale around this — it’s never shown to respondents."
          />

          {/* Sub-instrument 2: per-arm WTP (system-managed) */}
          <QCard
            title="Willingness to pay"
            locked
            lockLabel="SYSTEM-MANAGED"
            help="Each design is shown on its own and respondents choose a price band — or “I wouldn’t buy it.” We report a demand curve and rejection rate per design from these answers."
          />

          {/* Purchase verification (shared card) */}
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
      )}
    </section>
  )
}
