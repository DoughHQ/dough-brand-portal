'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from 'react'
import type {
  ConceptArmRow,
  ConceptStudyDraft,
  PricePosture,
  ProductCompetitorRow,
} from '@/lib/concept/types'
import { PRICE_POSTURE_OPTIONS } from '@/lib/concept/constants'
import {
  conceptProductRowErrors,
  evaluateFieldValidity,
  pricePostureHelp,
  stimulusModeLabel,
  type ConceptPublishFailure,
} from '@/lib/concept/validity'
import {
  MAX_CONCEPT_FIELD_SIZE,
  canAddCompetitor,
  canAddVariant,
  competitorProgressLabel,
} from '@/lib/concept/fieldSize'
import { formatPriceLabel } from '@/lib/concept/price'
import CompetitorsColumn from './CompetitorsColumn'
import OwnProductColumn from './OwnProductColumn'
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
  error?: string | null
  publishFailure?: ConceptPublishFailure | null
  disabled?: boolean
  disabledReason?: string | null
  onScoringTouched?: () => void
}

export default function FieldSection({
  draft,
  onChange,
  error,
  publishFailure = null,
  disabled,
  disabledReason,
}: Props) {
  const validity = evaluateFieldValidity(draft)
  const modeLabel = stimulusModeLabel(draft.stimulusMode)
  const packaging = draft.stimulusMode === 'package'
  const priceMode = draft.stimulusMode === 'price'
  const blindImageMode = packaging || priceMode
  function updateArms(arms: ConceptArmRow[]) {
    const leader = arms[0]
    const priceLabel = formatPriceLabel(leader?.frozen_price)
    const floor = draft.floor
      ? {
          ...draft.floor,
          config: {
            ...draft.floor.config,
            prompt: `Would you actually buy ${leader?.display_name.trim() || 'this'}${
              priceLabel != null ? ` at $${priceLabel}` : ''
            }?`,
          },
        }
      : draft.floor
    onChange({ ...draft, conceptArms: arms, floor })
  }

  function updateProducts(products: ProductCompetitorRow[]) {
    onChange({ ...draft, products })
  }

  // Every capacity/minimum decision on this screen comes from lib/concept/fieldSize.
  const addVariantAvailability = canAddVariant(draft)
  const addCompetitorAvailability = canAddCompetitor(draft)
  const competitorLabel = competitorProgressLabel(draft)

  // The one fact neither column can state on its own: the six seats are shared.
  //
  // Hidden entirely on an empty field. A capacity meter reading "0 of 6" announces
  // a constraint before anything exists to constrain — it only became reachable
  // once fresh drafts stopped seeding blank rows.
  const spots = `${validity.fieldSize} of ${MAX_CONCEPT_FIELD_SIZE} spots used`
  const reserved = validity.competitorsMissing
  const remaining = MAX_CONCEPT_FIELD_SIZE - validity.fieldSize
  const showCapacity = validity.fieldSize > 0
  const capacityText = !validity.fieldSizeOk
    ? `${spots} · Remove ${validity.fieldOverBy} item${validity.fieldOverBy === 1 ? '' : 's'}`
    : addVariantAvailability.allowed === false &&
        addVariantAvailability.reason === 'reserved-for-competitors'
      ? `${spots} · ${reserved} spot${reserved === 1 ? '' : 's'} reserved for ${
          reserved === 1 ? 'a required competitor' : 'required competitors'
        }`
      : validity.fieldSize >= MAX_CONCEPT_FIELD_SIZE
        ? `${spots} · field full`
        : // Say it before it bites, rather than going silent then "field full".
          remaining === 1
          ? `${spots} · 1 spot left`
          : spots

  return (
    <section style={{ ...sectionCard, position: 'relative' }} id="concept-field">
      <div style={{ ...sectionEyebrow, letterSpacing: '0.12em', color: 'var(--ink-50)' }}>
        Section 1 · Field
      </div>
      <h2
        className="cb-section-title"
        style={{
          ...sectionTitle,
          color: 'var(--ink-80)',
        }}
      >
        Build the field
      </h2>
      <p style={{ ...sectionHelp, maxWidth: 720 }}>
        Choose the product you want feedback on, then add the real products it should be
        judged against.
      </p>

      {disabled ? (
        <div className="cb-locked-panel" role="status">
          <strong>Choose a category to continue</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, maxWidth: 420 }}>
            {disabledReason ??
              'We’ll unlock your product and competitors after you select a category above.'}
          </p>
        </div>
      ) : null}

      <div
        style={{
          opacity: disabled ? 0.45 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        {!blindImageMode ? (
          <div style={{ marginBottom: 24 }}>
            <div style={labelSm}>Price posture</div>
            <div
              role="group"
              aria-label="Price posture"
              style={{
                display: 'inline-flex',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-sm)',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              {PRICE_POSTURE_OPTIONS.map((opt, i) => {
                const active = draft.pricePosture === opt.value
                const isLast = i === PRICE_POSTURE_OPTIONS.length - 1
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onChange({ ...draft, pricePosture: opt.value as PricePosture })
                    }
                    style={{
                      border: 'none',
                      borderRight: isLast ? 'none' : '1px solid var(--ink-10)',
                      background: active ? 'var(--sage)' : 'var(--white)',
                      color: active ? 'var(--white)' : 'var(--ink-50)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      height: 48,
                      padding: '0 16px',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.4 }}>
              {pricePostureHelp(draft.pricePosture)}
            </p>
          </div>
        ) : null}

        <div className="cb-field-grid">
          <OwnProductColumn
            arms={draft.conceptArms}
            onArmsChange={updateArms}
            brandId={draft.brandId}
            draftId={draft.draftId}
            priceMode={priceMode}
            blindImageMode={blindImageMode}
            pricePosture={draft.pricePosture}
            modeLabel={modeLabel}
            addVariant={addVariantAvailability}
            disabled={disabled}
          />

          <CompetitorsColumn
            products={draft.products}
            onProductsChange={updateProducts}
            priceMode={priceMode}
            hidePrice={blindImageMode}
            pricePosture={draft.pricePosture}
            addCompetitor={addCompetitorAvailability}
            progressLabel={competitorLabel}
            disabled={disabled}
            rowErrors={conceptProductRowErrors(draft.products, publishFailure)}
          />
        </div>
      </div>

      {!disabled && showCapacity ? (
        <div className="cb-field-status" role="status">
          {validity.fieldSizeOk ? (
            /* Plain text, not a pass: a full field is not the same as a valid study. */
            <span
              data-testid="field-capacity"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-50)' }}
            >
              {capacityText}
            </span>
          ) : (
            <span data-testid="field-capacity">
              <StatusChip ok={false} tone="warn" label={capacityText} />
            </span>
          )}
        </div>
      ) : null}

      {error ? (
        <p role="alert" style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </section>
  )
}

function StatusChip({
  ok,
  label,
  tone,
}: {
  ok: boolean
  label: string
  tone?: 'ok' | 'warn'
}) {
  const t = tone ?? (ok ? 'ok' : 'warn')
  const color = t === 'ok' ? 'var(--sage)' : 'var(--amber-warning)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        color,
      }}
    >
      <span className="cb-field-status-icon" data-tone={t} aria-hidden>
        {ok ? '✓' : '!'}
      </span>
      {label}
    </span>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="2.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4 5.5V4a2 2 0 114 0v1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StimulusGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5.2 2.5h5.6l1.7 3.2-4.5 7.3a.6.6 0 01-1 0L2.5 5.7l1.7-3.2z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.2" r="1.1" fill="currentColor" />
    </svg>
  )
}
