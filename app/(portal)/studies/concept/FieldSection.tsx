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
import { createClient } from '@/lib/supabase'
import type { AdminProductSearchResult } from '@/lib/queries'
import type {
  ConceptArmRow,
  ConceptStudyDraft,
  PricePosture,
  ProductCompetitorRow,
} from '@/lib/concept/types'
import { PRICE_POSTURE_OPTIONS } from '@/lib/concept/constants'
import { armLabelForIndex, newConceptArm, newProductCompetitor } from '@/lib/concept/defaults'
import {
  evaluateFieldValidity,
  pricePostureHelp,
  stimulusModeLabel,
} from '@/lib/concept/validity'
import { uniquePairs } from '@/lib/concept/publish'
import { formatPriceLabel, isAllowedPriceInput } from '@/lib/concept/price'
import { useTypeahead } from '@/lib/concept/useTypeahead'
import ConceptArmImageUploader from './ConceptArmImageUploader'
import SuggestionDropdown from './SuggestionDropdown'
import {
  competitorCard,
  fieldCard,
  inputBase,
  labelSm,
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
  trashBtn,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
  disabled?: boolean
  disabledReason?: string | null
  onScoringTouched?: () => void
}

function DragHandle() {
  return (
    <span
      aria-hidden
      style={{
        color: 'var(--ink-30)',
        fontSize: 14,
        letterSpacing: 1,
        userSelect: 'none',
        lineHeight: 1,
        paddingTop: 2,
      }}
    >
      ⠿
    </span>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M4 4l.5 7a1 1 0 001 1h3a1 1 0 001-1L10 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function FieldSection({
  draft,
  onChange,
  error,
  disabled,
  disabledReason,
}: Props) {
  const validity = evaluateFieldValidity(draft)
  const modeLabel = stimulusModeLabel(draft.stimulusMode)
  const packaging = draft.stimulusMode === 'package'
  const priceMode = draft.stimulusMode === 'price'
  const blindImageMode = packaging || priceMode
  const armFocusRef = useRef<HTMLInputElement | null>(null)
  const productFocusRef = useRef<HTMLInputElement | null>(null)
  const [focusArm, setFocusArm] = useState(false)
  const [focusProduct, setFocusProduct] = useState(false)
  const [dragArmId, setDragArmId] = useState<string | null>(null)
  const [dragProductId, setDragProductId] = useState<string | null>(null)

  useEffect(() => {
    if (focusArm) {
      armFocusRef.current?.focus()
      setFocusArm(false)
    }
  }, [focusArm, draft.conceptArms.length])

  useEffect(() => {
    if (focusProduct) {
      productFocusRef.current?.focus()
      setFocusProduct(false)
    }
  }, [focusProduct, draft.products.length])

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

  function addArm() {
    if (priceMode) return
    updateArms([...draft.conceptArms, newConceptArm(draft.conceptArms.length)])
    setFocusArm(true)
  }

  function addProduct() {
    updateProducts([...draft.products, newProductCompetitor()])
    setFocusProduct(true)
  }

  function onArmKeyDown(e: KeyboardEvent, isLast: boolean) {
    if (e.key === 'Enter' && isLast && !priceMode) {
      e.preventDefault()
      addArm()
    }
  }

  function onProductKeyDown(e: KeyboardEvent, isLast: boolean) {
    if (e.key === 'Enter' && isLast) {
      e.preventDefault()
      addProduct()
    }
  }

  function reorderArms(fromId: string, toId: string) {
    if (fromId === toId) return
    const next = [...draft.conceptArms]
    const from = next.findIndex((a) => a.localId === fromId)
    const to = next.findIndex((a) => a.localId === toId)
    if (from < 0 || to < 0) return
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    updateArms(
      next.map((a, i) => ({
        ...a,
        arm_label: armLabelForIndex(i),
      }))
    )
  }

  function reorderProducts(fromId: string, toId: string) {
    if (fromId === toId) return
    const next = [...draft.products]
    const from = next.findIndex((a) => a.localId === fromId)
    const to = next.findIndex((a) => a.localId === toId)
    if (from < 0 || to < 0) return
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    updateProducts(next)
  }

  const ownNamed = draft.conceptArms.some((a) => a.display_name.trim().length > 0)
  const competitorCount = draft.products.filter((p) => p.product_id != null).length
  const competitorsOk = priceMode ? competitorCount >= 1 : competitorCount >= 2
  const imagesOk = !blindImageMode || validity.imagesOk

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
        {/* Guided workflow strip */}
        <div className="cb-field-workflow" role="group" aria-label="How to build the field">
          <div className="cb-field-workflow-step">
            <span className="cb-field-workflow-num" aria-hidden>
              1
            </span>
            <div className="cb-field-workflow-copy">
              <div className="cb-field-workflow-label">Your product</div>
              <p className="cb-field-workflow-help">
                Add the product you want respondents to evaluate.
              </p>
            </div>
          </div>
          <div className="cb-field-workflow-chevron" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.25 3.75L13.5 10l-6.25 6.25"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="cb-field-workflow-step">
            <span className="cb-field-workflow-num" aria-hidden>
              2
            </span>
            <div className="cb-field-workflow-copy">
              <div className="cb-field-workflow-label">Competitors</div>
              <p className="cb-field-workflow-help">
                Add {priceMode ? '1–6' : '2–6'} real products shoppers would compare it
                against.
              </p>
            </div>
          </div>
          <div className="cb-field-workflow-note">
            <span className="cb-field-workflow-note-icon" aria-hidden>
              ✦
            </span>
            <p className="cb-field-workflow-note-text">
              {priceMode
                ? 'Both are required for a credible shelf comparison.'
                : 'Together, they create a credible shelf comparison.'}
            </p>
          </div>
        </div>

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
          {/* LEFT — your product · header */}
          <div className="cb-field-head-left">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div className="cb-field-col-title">
                  {priceMode ? 'Your product' : 'Your concept arms'}
                </div>
                <div
                  className="cb-field-col-meta"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <LockIcon />
                  Private · shown blind to respondents
                </div>
              </div>
              {!priceMode ? (
                <button type="button" onClick={addArm} className="cb-btn-outline">
                  + Add arm
                </button>
              ) : null}
            </div>
          </div>

          {/* LEFT — your product · body */}
          <div className="cb-field-body-left">
            {!priceMode && draft.conceptArms.length >= 6 ? (
              <p
                role="status"
                style={{
                  margin: '0 0 12px',
                  fontSize: 12,
                  color: 'var(--ink-50)',
                  lineHeight: 1.45,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--ink-10)',
                  borderRadius: 'var(--r-md)',
                  padding: 12,
                }}
              >
                Five arms means every respondent sees all {uniquePairs(5)} pairs. A sixth
                makes {uniquePairs(6)} — each respondent sees part of the comparison.
              </p>
            ) : null}

            {draft.conceptArms.map((arm, index) => {
              const isLast = index === draft.conceptArms.length - 1
              return (
                <div
                  key={arm.localId}
                  draggable={!priceMode}
                  onDragStart={() => setDragArmId(arm.localId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragArmId) reorderArms(dragArmId, arm.localId)
                    setDragArmId(null)
                  }}
                  style={{
                    ...fieldCard,
                    cursor: priceMode ? 'default' : 'grab',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {!priceMode ? <DragHandle /> : null}
                    <span className="cb-own-badge">Own product</span>
                    {!priceMode ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--ink-50)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {arm.arm_label || armLabelForIndex(index)}
                      </span>
                    ) : null}
                    <div style={{ flex: 1 }} />
                    {!priceMode ? (
                      <button
                        type="button"
                        aria-label="Delete concept arm"
                        onClick={() =>
                          updateArms(
                            draft.conceptArms
                              .filter((a) => a.localId !== arm.localId)
                              .map((a, i) => ({ ...a, arm_label: armLabelForIndex(i) }))
                          )
                        }
                        style={trashBtn}
                      >
                        <TrashIcon />
                      </button>
                    ) : null}
                  </div>

                  <label style={labelSm} htmlFor={`arm-name-${arm.localId}`}>
                    Display name
                  </label>
                  <input
                    id={`arm-name-${arm.localId}`}
                    className="cb-input"
                    ref={index === draft.conceptArms.length - 1 ? armFocusRef : undefined}
                    value={arm.display_name}
                    onChange={(e) => {
                      const next = draft.conceptArms.map((a) =>
                        a.localId === arm.localId
                          ? { ...a, display_name: e.target.value }
                          : a
                      )
                      updateArms(next)
                    }}
                    onKeyDown={(e) => onArmKeyDown(e, isLast)}
                    placeholder="Concept name"
                    style={{ ...inputBase, marginBottom: 16 }}
                  />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: blindImageMode ? '1fr' : '1fr 1fr',
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={labelSm}>Stimulus type</div>
                      <div
                        style={{
                          ...inputBase,
                          height: 48,
                          background: 'var(--surface-1)',
                          color: 'var(--ink-80)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          border: '1px solid var(--ink-10)',
                        }}
                      >
                        <StimulusGlyph />
                        {modeLabel}
                      </div>
                    </div>
                    {!blindImageMode ? (
                      <div>
                        <label style={labelSm}>Price</label>
                        <input
                          className="cb-input"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={arm.frozen_price ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value
                            if (!isAllowedPriceInput(raw)) return
                            const next = draft.conceptArms.map((a) =>
                              a.localId === arm.localId
                                ? { ...a, frozen_price: raw.trim() === '' ? null : raw }
                                : a
                            )
                            updateArms(next)
                          }}
                          onKeyDown={(e) => onArmKeyDown(e, isLast)}
                          placeholder={draft.pricePosture === 'blind' ? '—' : '4.99'}
                          style={inputBase}
                        />
                      </div>
                    ) : null}
                  </div>

                  <ConceptArmImageUploader
                    brandId={draft.brandId}
                    draftId={draft.draftId}
                    armLabel={arm.arm_label || armLabelForIndex(index)}
                    imageUrl={arm.image_url}
                    imageFilename={arm.image_filename}
                    requiredHint={blindImageMode}
                    variant="hero"
                    disabled={disabled}
                    onChange={({ image_url, image_filename }) => {
                      const next = draft.conceptArms.map((a) =>
                        a.localId === arm.localId
                          ? { ...a, image_url, image_filename }
                          : a
                      )
                      updateArms(next)
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* RIGHT — competitors · header */}
          <div className="cb-field-head-right">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div>
                <div className="cb-field-col-title">Competitors</div>
                <div className="cb-field-col-meta">
                  What shoppers actually see on shelf
                </div>
              </div>
              <button type="button" onClick={addProduct} className="cb-btn-outline">
                + Add competitor
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--ink-50)',
                lineHeight: 1.45,
              }}
            >
              Add {priceMode ? '1–6' : '2–6'} real products for a credible comparison.
            </p>
          </div>

          {/* RIGHT — competitors · body */}
          <div className="cb-field-body-right">
            {draft.products.length === 0 ? (
              <div
                style={{
                  border: 'var(--cb-border-dashed)',
                  borderRadius: 'var(--r-lg)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  background: 'var(--cb-surface-muted)',
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--ink-80)',
                    marginBottom: 8,
                  }}
                >
                  No competitors added yet
                </div>
                <p
                  style={{
                    margin: '0 0 16px',
                    fontSize: 13,
                    color: 'var(--ink-50)',
                    lineHeight: 1.45,
                    maxWidth: 280,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  Add {priceMode ? '1–6' : '2–6'} real products to create a credible shelf
                  comparison.
                </p>
                <button type="button" onClick={addProduct} className="cb-btn-outline">
                  + Add competitor
                </button>
              </div>
            ) : null}

            {draft.products.map((row, index) => {
              const isLast = index === draft.products.length - 1
              return (
                <ProductCompetitorCard
                  key={row.localId}
                  row={row}
                  focusRef={index === draft.products.length - 1 ? productFocusRef : null}
                  pricePosture={draft.pricePosture}
                  hidePrice={blindImageMode}
                  showMarketPrice={priceMode}
                  onChange={(nextRow) => {
                    updateProducts(
                      draft.products.map((p) => (p.localId === row.localId ? nextRow : p))
                    )
                  }}
                  onDelete={() =>
                    updateProducts(draft.products.filter((p) => p.localId !== row.localId))
                  }
                  onKeyDown={(e) => onProductKeyDown(e, isLast)}
                  onDragStart={() => setDragProductId(row.localId)}
                  onDrop={() => {
                    if (dragProductId) reorderProducts(dragProductId, row.localId)
                    setDragProductId(null)
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {!disabled ? (
        <div className="cb-field-status" role="status">
          <StatusChip ok={ownNamed} label={ownNamed ? 'Own product added' : 'Add your product'} />
          <span className="cb-field-status-sep" aria-hidden />
          <StatusChip
            ok={competitorsOk}
            label={
              competitorCount === 0
                ? `Add ${priceMode ? 'a competitor' : 'competitors'}`
                : `${competitorCount} competitor${competitorCount === 1 ? '' : 's'} added`
            }
          />
          {blindImageMode ? (
            <>
              <span className="cb-field-status-sep" aria-hidden />
              <StatusChip
                ok={imagesOk}
                tone={imagesOk ? 'ok' : 'warn'}
                label={imagesOk ? 'Pack image set' : 'Pack image required'}
              />
            </>
          ) : (
            <>
              <span className="cb-field-status-sep" aria-hidden />
              <StatusChip
                ok={validity.priceOk}
                tone={validity.priceOk ? 'ok' : 'warn'}
                label={validity.priceMessage.replace(/^[✓✗]\s*/, '')}
              />
            </>
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

function ProductCompetitorCard({
  row,
  focusRef,
  pricePosture,
  hidePrice,
  showMarketPrice,
  onChange,
  onDelete,
  onKeyDown,
  onDragStart,
  onDrop,
}: {
  row: ProductCompetitorRow
  focusRef: Ref<HTMLInputElement> | null
  pricePosture: PricePosture
  hidePrice?: boolean
  /** Price studies derive the WTP ladder from real shelf prices. */
  showMarketPrice?: boolean
  onChange: (row: ProductCompetitorRow) => void
  onDelete: () => void
  onKeyDown: (e: KeyboardEvent) => void
  onDragStart: () => void
  onDrop: () => void
}) {
  const supabase = createClient()
  const listId = useId()
  const searchRootRef = useRef<HTMLDivElement>(null)

  const fetchCompetitors = useCallback(
    async (q: string, _signal: AbortSignal) => {
      const { data, error } = await supabase.rpc('search_products_admin', {
        p_query: q,
      })
      if (error) throw error
      return ((data ?? []) as AdminProductSearchResult[]).slice(0, 8)
    },
    [supabase]
  )

  const {
    query,
    setQuery,
    results,
    status,
    activeIndex,
    setActiveIndex,
    open,
    setOpen,
    reset,
    retry,
    close,
  } = useTypeahead<AdminProductSearchResult>(fetchCompetitors, {
    enabled: row.product_id == null,
  })

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!searchRootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  // Reset the image-load fallback whenever the selected product changes.
  const [imgFailed, setImgFailed] = useState(false)
  useEffect(() => {
    setImgFailed(false)
  }, [row.product_id, row.frozen_image_url])

  function pick(p: AdminProductSearchResult) {
    onChange({
      ...row,
      product_id: p.product_id,
      frozen_display_name: p.product_name_clean,
      frozen_brand_name: p.brand_name,
      frozen_image_url: p.image_url ?? null,
      frozen_price: row.frozen_price,
    })
    reset()
  }

  function clearProduct() {
    onChange({
      ...row,
      product_id: null,
      frozen_display_name: '',
      frozen_brand_name: '',
      frozen_image_url: null,
    })
    reset()
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      const hit = results[activeIndex]
      if (hit && status === 'success') {
        e.preventDefault()
        pick(hit)
        return
      }
    }
    onKeyDown(e)
  }

  const showDropdown = open && status !== 'idle' && row.product_id == null

  const rowThumb: CSSProperties = {
    width: 64,
    height: 64,
    marginRight: 4,
    flexShrink: 0,
    objectFit: 'contain',
    display: 'block',
    background: 'var(--surface-1)',
    border: '1px solid var(--ink-10)',
    borderRadius: 'var(--cb-radius-media)',
  }

  return (
    <div
      className="cb-competitor-row"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{
        ...competitorCard,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
      }}
    >
      <DragHandle />

      {row.product_id != null ? (
        <>
          {row.frozen_image_url && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.frozen_image_url}
              alt=""
              style={rowThumb}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              style={{
                ...rowThumb,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--ink-30)',
                textAlign: 'center',
                padding: 4,
                borderStyle: 'dashed',
                borderColor: 'var(--cb-border-strong)',
                background: 'var(--cb-surface-muted)',
              }}
            >
              Pack
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink-80)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.frozen_display_name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 4 }}>
              {row.frozen_brand_name}
            </div>
            {!hidePrice ? (
              <input
                className="cb-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={row.frozen_price ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  if (!isAllowedPriceInput(raw)) return
                  onChange({
                    ...row,
                    frozen_price: raw.trim() === '' ? null : raw,
                  })
                }}
                onKeyDown={onKeyDown}
                placeholder={pricePosture === 'blind' ? '—' : '4.99'}
                style={{ ...inputBase, height: 36, marginTop: 8, maxWidth: 120 }}
              />
            ) : null}
            {showMarketPrice ? (
              <div style={{ marginTop: 10 }}>
                <label style={{ ...labelSm, marginBottom: 4 }} htmlFor={`shelf-price-${row.localId}`}>
                  Shelf price
                </label>
                <input
                  id={`shelf-price-${row.localId}`}
                  className="cb-input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={row.market_reference_price ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (!isAllowedPriceInput(raw)) return
                    onChange({
                      ...row,
                      market_reference_price: raw.trim() === '' ? null : raw,
                    })
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="4.99"
                  style={{ ...inputBase, height: 36, maxWidth: 120 }}
                />
                <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--ink-50)' }}>
                  What it actually sells for. Sets the willingness-to-pay range from the
                  real shelf instead of your expected price. Never shown to respondents.
                </p>
              </div>
            ) : null}
          </div>
          <button type="button" onClick={clearProduct} className="cb-btn-change">
            Change
          </button>
          <button type="button" aria-label="Delete competitor" onClick={onDelete} style={trashBtn}>
            <TrashIcon />
          </button>
        </>
      ) : (
        <div ref={searchRootRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <label style={labelSm} htmlFor={`competitor-search-${row.localId}`}>
            Product search
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id={`competitor-search-${row.localId}`}
              className="cb-input"
              ref={focusRef ?? undefined}
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                showDropdown && status === 'success' && results[activeIndex]
                  ? `${listId}-opt-${results[activeIndex]!.product_id}`
                  : undefined
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => {
                if (query.trim().length >= 2) setOpen(true)
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search products…"
              style={{ ...inputBase, flex: 1 }}
              autoComplete="off"
            />
            <button type="button" aria-label="Delete competitor" onClick={onDelete} style={trashBtn}>
              <TrashIcon />
            </button>
          </div>
          {showDropdown ? (
            <SuggestionDropdown
              id={listId}
              status={status}
              results={results}
              activeIndex={activeIndex}
              onActiveIndex={setActiveIndex}
              onSelect={pick}
              onRetry={retry}
              getKey={(p) => p.product_id}
              renderItem={(p) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      style={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        objectFit: 'contain',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--ink-10)',
                        borderRadius: 'var(--cb-radius-media)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        background: 'var(--surface-1)',
                        border: 'var(--cb-border-dashed)',
                        borderRadius: 'var(--cb-radius-media)',
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{p.product_name_clean}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 4 }}>
                      {p.brand_name}
                      {p.l3_name ? ` · ${p.l3_name}` : ''}
                    </div>
                  </div>
                </div>
              )}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
