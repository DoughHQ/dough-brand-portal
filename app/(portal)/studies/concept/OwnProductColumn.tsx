'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { ConceptArmRow, PricePosture } from '@/lib/concept/types'
import { armLabelForIndex, newConceptArm } from '@/lib/concept/defaults'
import { isAllowedPriceInput } from '@/lib/concept/price'
import type { AddAvailability } from '@/lib/concept/fieldSize'
import ConceptArmImageUploader from './ConceptArmImageUploader'
import { DragHandle, TrashIcon } from './fieldIcons'
import { fieldCard, inputBase, labelSm, sectionEyebrow, trashBtn } from './conceptStyles'

/**
 * Section 1 · left column — "Your product".
 *
 * Object first, configuration second. The operator declares the product they are
 * testing, then Dough asks for the minimum needed to represent it in the study.
 *
 * Methodology note: a row here is a `ConceptArmRow` ("own arm" internally). In
 * packaging studies multiple rows are packaging variants of the same product; a
 * standalone price study is capped to a single row upstream. Neither the wire
 * shape nor the validity rules change here — only how it is presented.
 */

type Props = {
  arms: ConceptArmRow[]
  onArmsChange: (next: ConceptArmRow[]) => void
  brandId: number
  draftId: string
  /** Standalone price study — exactly one own product, no variants. */
  priceMode: boolean
  /** Packaging / price — pack image required, prices forced blind. */
  blindImageMode: boolean
  pricePosture: PricePosture
  modeLabel: string
  /** Authoritative field-capacity verdict — owned by lib/concept/fieldSize. */
  addVariant: AddAvailability
  disabled?: boolean
}

export default function OwnProductColumn({
  arms,
  onArmsChange,
  brandId,
  draftId,
  priceMode,
  blindImageMode,
  pricePosture,
  modeLabel,
  addVariant: addVariantAvailability,
  disabled,
}: Props) {
  const nameFocusRef = useRef<HTMLInputElement | null>(null)
  const [focusName, setFocusName] = useState(false)
  const [dragArmId, setDragArmId] = useState<string | null>(null)
  // Latches once setup begins so clearing a field never bounces back to the invitation.
  const [revealed, setRevealed] = useState(false)

  const configured = arms.some((a) => a.display_name.trim() || a.image_url)
  const showEmptyState = !configured && !revealed
  const multi = arms.length > 1

  useEffect(() => {
    if (focusName) {
      nameFocusRef.current?.focus()
      setFocusName(false)
    }
  }, [focusName, arms.length])

  /**
   * This action owns creation of the first product.
   *
   * A fresh draft now arrives with zero arms (Pass 3), so the common path here
   * is "make the first row". The `arms.length > 1` branch is legacy handling:
   * drafts stored before Pass 3 can still carry two blank seed rows, and those
   * collapse to one rather than leaving the operator owing two names.
   */
  function startSetup() {
    setRevealed(true)
    if (arms.length === 0) {
      onArmsChange([newConceptArm(0)])
    } else if (arms.length > 1) {
      onArmsChange([{ ...arms[0]!, arm_label: armLabelForIndex(0) }])
    }
    setFocusName(true)
  }

  function addVariant() {
    if (priceMode || !addVariantAvailability.allowed) return
    onArmsChange([...arms, newConceptArm(arms.length)])
    setFocusName(true)
  }

  function removeVariant(localId: string) {
    onArmsChange(
      arms
        .filter((a) => a.localId !== localId)
        .map((a, i) => ({ ...a, arm_label: armLabelForIndex(i) }))
    )
  }

  function patchArm(localId: string, patch: Partial<ConceptArmRow>) {
    onArmsChange(arms.map((a) => (a.localId === localId ? { ...a, ...patch } : a)))
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return
    const next = [...arms]
    const from = next.findIndex((a) => a.localId === fromId)
    const to = next.findIndex((a) => a.localId === toId)
    if (from < 0 || to < 0) return
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    onArmsChange(next.map((a, i) => ({ ...a, arm_label: armLabelForIndex(i) })))
  }

  function onNameKeyDown(e: KeyboardEvent, isLast: boolean) {
    if (e.key === 'Enter' && isLast && !priceMode) {
      e.preventDefault()
      addVariant()
    }
  }

  return (
    <>
      <div className="cb-field-head-left">
        <div className="cb-field-col-title">Your product</div>
        <div className="cb-field-col-meta">
          {priceMode
            ? 'The product or concept you want respondents to evaluate.'
            : 'Add the product or concept variants you want respondents to evaluate.'}
        </div>
      </div>

      <div className="cb-field-body-left">
        {showEmptyState ? (
          <div
            style={{
              border: 'var(--cb-border-dashed)',
              borderRadius: 'var(--r-lg)',
              background: 'var(--cb-surface-muted)',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <PackageGlyph />
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink-80)',
                marginBottom: 8,
              }}
            >
              Add your product
            </div>
            <p
              style={{
                margin: '0 auto 16px',
                maxWidth: 280,
                fontSize: 13,
                color: 'var(--ink-50)',
                lineHeight: 1.45,
              }}
            >
              Set up the product or concept respondents will evaluate in this study.
            </p>
            <button
              type="button"
              className="cb-btn-outline"
              onClick={startSetup}
              disabled={disabled}
            >
              + Add your product
            </button>
          </div>
        ) : null}

        {!showEmptyState
          ? arms.map((arm, index) => {
              const isLast = index === arms.length - 1
              const label = arm.arm_label || armLabelForIndex(index)
              const name = arm.display_name.trim()
              return (
                <div
                  key={arm.localId}
                  draggable={multi && !priceMode}
                  onDragStart={() => setDragArmId(arm.localId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragArmId) reorder(dragArmId, arm.localId)
                    setDragArmId(null)
                  }}
                  style={{
                    ...fieldCard,
                    cursor: multi && !priceMode ? 'grab' : 'default',
                  }}
                >
                  {/* ownership + variant identity */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {multi && !priceMode ? <DragHandle /> : null}
                    <span className="cb-own-badge">Own product</span>
                    {multi ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--ink-50)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Variant {label}
                      </span>
                    ) : null}
                    <div style={{ flex: 1 }} />
                    {multi ? (
                      <button
                        type="button"
                        aria-label={`Remove variant ${label}`}
                        onClick={() => removeVariant(arm.localId)}
                        style={trashBtn}
                      >
                        <TrashIcon />
                      </button>
                    ) : null}
                  </div>

                  {/* what object am I configuring? */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-80)' }}>
                      {name || 'New product concept'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 4 }}>
                      {multi ? `Variant ${label} of your product` : 'Your product in this study'}
                    </div>
                  </div>

                  {/* 1 · identity */}
                  <label style={labelSm} htmlFor={`arm-name-${arm.localId}`}>
                    Product name
                  </label>
                  <input
                    id={`arm-name-${arm.localId}`}
                    className="cb-input"
                    ref={isLast ? nameFocusRef : undefined}
                    value={arm.display_name}
                    onChange={(e) => patchArm(arm.localId, { display_name: e.target.value })}
                    onKeyDown={(e) => onNameKeyDown(e, isLast)}
                    placeholder="e.g. Midnight Cocoa — matte black"
                    style={{ ...inputBase, marginBottom: 24 }}
                  />

                  {/* 2 · the thing respondents actually evaluate */}
                  <ConceptArmImageUploader
                    brandId={brandId}
                    draftId={draftId}
                    armLabel={label}
                    imageUrl={arm.image_url}
                    imageFilename={arm.image_filename}
                    requiredHint={blindImageMode}
                    variant="hero"
                    disabled={disabled}
                    onChange={({ image_url, image_filename }) =>
                      patchArm(arm.localId, { image_url, image_filename })
                    }
                  />

                  {/* 3 · study-controlled context — read-only, not a task */}
                  <div style={{ marginTop: 24 }}>
                    <div style={sectionEyebrow}>Study format</div>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>
                      {modeLabel}
                      {blindImageMode ? ' · shown blind to respondents' : ''}
                    </div>
                  </div>

                  {/* 4 · study-specific settings, only where they apply */}
                  {!blindImageMode ? (
                    <div style={{ marginTop: 24 }}>
                      <label style={labelSm} htmlFor={`arm-price-${arm.localId}`}>
                        Price
                      </label>
                      <input
                        id={`arm-price-${arm.localId}`}
                        className="cb-input"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={arm.frozen_price ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (!isAllowedPriceInput(raw)) return
                          patchArm(arm.localId, {
                            frozen_price: raw.trim() === '' ? null : raw,
                          })
                        }}
                        onKeyDown={(e) => onNameKeyDown(e, isLast)}
                        placeholder={pricePosture === 'blind' ? '—' : '4.99'}
                        style={inputBase}
                      />
                    </div>
                  ) : null}
                </div>
              )
            })
          : null}

        {!showEmptyState && !priceMode ? (
          <>
            <button
              type="button"
              className="cb-btn-outline"
              onClick={addVariant}
              disabled={disabled || !addVariantAvailability.allowed}
              aria-describedby={
                addVariantAvailability.allowed ? undefined : 'cb-add-variant-reason'
              }
            >
              + Add another variant
            </button>
            {!addVariantAvailability.allowed ? (
              <p
                id="cb-add-variant-reason"
                style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  color: 'var(--ink-50)',
                  lineHeight: 1.45,
                }}
              >
                {addVariantAvailability.message}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}

function PackageGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block', margin: '0 auto 12px', color: 'var(--ink-50)' }}
    >
      <path
        d="M12 2.75l7.5 4v10.5l-7.5 4-7.5-4V6.75l7.5-4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4.5 6.75L12 10.75l7.5-4M12 10.75v10.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
