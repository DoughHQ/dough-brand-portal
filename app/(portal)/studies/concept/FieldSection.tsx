'use client'

import { useEffect, useState } from 'react'
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
import { respondentDesignLabel } from '@/lib/concept/designLetters'
import { formatPriceLabel } from '@/lib/concept/price'
import { uniquePairs } from '@/lib/concept/publish'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'
import { createClient } from '@/lib/supabase'
import CompetitorsColumn from './CompetitorsColumn'
import OwnProductColumn from './OwnProductColumn'
import {
  labelSm,
  sectionCard,
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
  /** Single concept test — equal concepts and competitors; no hero rewrite. */
  singleTestMode?: boolean
}

export default function FieldSection({
  draft,
  onChange,
  error,
  publishFailure = null,
  disabled,
  disabledReason,
  singleTestMode = true,
}: Props) {
  const validity = evaluateFieldValidity(draft)
  const battles = uniquePairs(draft.conceptArms.length + draft.products.length)
  const modeLabel = stimulusModeLabel(draft.stimulusMode)
  const packaging = draft.stimulusMode === 'package'
  const priceMode = draft.stimulusMode === 'price'
  const blindImageMode = packaging || priceMode
  function updateArms(arms: ConceptArmRow[]) {
    if (singleTestMode) {
      // Single-test never rewrites floor prompts from arm names (label bias).
      onChange({ ...draft, conceptArms: arms })
      return
    }
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

  // The one fact neither column can state on its own: the five seats are shared.
  //
  // Hidden entirely on an empty field. A capacity meter reading "0 of 5" announces
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

  // Single-test: the shelf owns capacity + matchup copy. Legacy modes keep the strip.
  const shelfOwnsStatus = singleTestMode && showCapacity

  return (
    <section style={{ ...sectionCard, position: 'relative' }} id="concept-field">
      <h2
        className="cb-section-title"
        style={{
          ...sectionTitle,
          color: 'var(--ink-80)',
        }}
      >
        Build the field
      </h2>
      <p style={{ ...sectionHelp, maxWidth: 720, marginBottom: 24 }}>
        Add your concepts, then choose the real products shoppers would compare them against.
      </p>
      {!singleTestMode && battles > 0 ? (
        <p className="cb-field-battles">
          {draft.conceptArms.length + draft.products.length} products → {battles}{' '}
          {battles === 1 ? 'battle' : 'battles'} per respondent
        </p>
      ) : null}

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
            singleTestMode={singleTestMode}
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
            singleTestMode={singleTestMode}
          />
        </div>
        {singleTestMode ? (
          <FieldShelf
            draft={draft}
            battles={battles}
            capacityText={capacityText}
            fieldSizeOk={validity.fieldSizeOk}
            remaining={Math.max(0, remaining)}
          />
        ) : null}
      </div>

      {!disabled && showCapacity && !shelfOwnsStatus ? (
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

type ShelfSeat =
  | { kind: 'arm'; localId: string; index: number; name: string; imageRef: string | null }
  | {
      kind: 'product'
      localId: string
      name: string
      brand: string
      imageSrc: string | null
    }
  | { kind: 'empty'; key: string }

function FieldShelf({
  draft,
  battles,
  capacityText,
  fieldSizeOk,
  remaining,
}: {
  draft: ConceptStudyDraft
  battles: number
  capacityText: string
  fieldSizeOk: boolean
  remaining: number
}) {
  const filled: ShelfSeat[] = [
    ...draft.conceptArms.map((arm, index) => ({
      kind: 'arm' as const,
      localId: arm.localId,
      index,
      name: arm.display_name.trim() || 'Name this design',
      imageRef: arm.image_url,
    })),
    ...draft.products.map((product) => ({
      kind: 'product' as const,
      localId: product.localId,
      name: product.frozen_display_name.trim() || 'Competitor',
      brand: product.frozen_brand_name.trim(),
      imageSrc: product.frozen_image_url,
    })),
  ]
  if (filled.length === 0) return null

  const emptyCount = Math.min(
    remaining,
    Math.max(0, MAX_CONCEPT_FIELD_SIZE - filled.length)
  )
  const seats: ShelfSeat[] = [
    ...filled,
    ...Array.from({ length: emptyCount }, (_, i) => ({
      kind: 'empty' as const,
      key: `empty-${i}`,
    })),
  ]

  const n = filled.length
  const productWord = n === 1 ? 'product' : 'products'
  const matchupWord = battles === 1 ? 'matchup' : 'matchups'
  const metaParts = [
    `${n} ${productWord}`,
    battles > 0 ? `${battles} ${matchupWord} per respondent` : null,
    remaining > 0
      ? remaining === 1
        ? '1 spot left'
        : `${remaining} spots left`
      : 'field full',
  ].filter(Boolean)

  return (
    <div className="cb-field-shelf" data-testid="field-shelf">
      <div className="cb-field-shelf-head">
        <div className="cb-field-shelf-title">Your field</div>
        <p
          className="cb-field-shelf-meta"
          role="status"
          data-testid="field-capacity"
          data-ok={fieldSizeOk ? 'true' : 'false'}
        >
          {!fieldSizeOk ? (
            <StatusChip ok={false} tone="warn" label={capacityText} />
          ) : (
            metaParts.join(' · ')
          )}
        </p>
      </div>
      <ul className="cb-field-shelf-rail" aria-label="Products in the field">
        {seats.map((seat) => {
          if (seat.kind === 'empty') {
            return (
              <li key={seat.key} className="cb-field-shelf-tile is-empty" aria-hidden>
                <span className="cb-field-shelf-photo" />
                <span className="cb-field-shelf-copy">
                  <strong>Open</strong>
                  Spot
                </span>
              </li>
            )
          }
          const focusId =
            seat.kind === 'arm'
              ? `field-seat-arm-${seat.localId}`
              : `field-seat-product-${seat.localId}`
          const subtitle =
            seat.kind === 'arm' ? respondentDesignLabel(seat.index) : seat.brand || 'Competitor'
          return (
            <li key={`${seat.kind}-${seat.localId}`}>
              <button
                type="button"
                className="cb-field-shelf-tile"
                onClick={() => focusFieldSeat(focusId)}
              >
                {seat.kind === 'arm' ? (
                  <MemberPhoto imageRef={seat.imageRef} />
                ) : (
                  <MemberPhoto src={seat.imageSrc} />
                )}
                <span className="cb-field-shelf-copy">
                  <strong>{seat.name}</strong>
                  {subtitle}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function focusFieldSeat(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  el.classList.add('is-shelf-focus')
  window.setTimeout(() => el.classList.remove('is-shelf-focus'), 1200)
  const focusable = el.querySelector<HTMLElement>(
    'input:not([type="hidden"]), button.cb-concept-stage-replace, [data-shelf-focus]'
  )
  focusable?.focus({ preventScroll: true })
}

function MemberPhoto({ imageRef, src }: { imageRef?: string | null; src?: string | null }) {
  const [url, setUrl] = useState<string | null>(src ?? null)
  useEffect(() => {
    if (src) {
      setUrl(src)
      return
    }
    if (!imageRef) {
      setUrl(null)
      return
    }
    let cancelled = false
    const supabase = createClient()
    void resolveStimuliPreviewUrl(supabase, imageRef).then((next) => {
      if (!cancelled) setUrl(next)
    })
    return () => {
      cancelled = true
    }
  }, [imageRef, src])
  return (
    <span className="cb-field-shelf-photo">
      {url ? <img src={url} alt="" /> : null}
    </span>
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
