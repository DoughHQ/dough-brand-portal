'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from 'react'
import { createClient } from '@/lib/supabase'
import type { AdminProductSearchResult } from '@/lib/queries'
import type {
  BattleIntent,
  ConceptArmRow,
  ConceptStudyDraft,
  PricePosture,
  ProductCompetitorRow,
  StimulusType,
} from '@/lib/concept/types'
import {
  BATTLE_INTENT_OPTIONS,
  PRICE_POSTURE_OPTIONS,
  STIMULUS_TYPE_OPTIONS,
} from '@/lib/concept/constants'
import { newConceptArm, newProductCompetitor } from '@/lib/concept/defaults'
import { evaluateFieldValidity, pricePostureHelp } from '@/lib/concept/validity'
import { formatPriceLabel, isAllowedPriceInput } from '@/lib/concept/price'
import {
  competitorCard,
  ghostLink,
  inputBase,
  intentTagStyle,
  labelSm,
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
  selectBase,
  trashBtn,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
}

function intentLabel(intent: BattleIntent): string {
  return BATTLE_INTENT_OPTIONS.find((o) => o.value === intent)?.tag ?? intent
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

export default function FieldSection({ draft, onChange, error }: Props) {
  const validity = evaluateFieldValidity(draft)
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
    updateArms([...draft.conceptArms, newConceptArm(draft.conceptArms.length)])
    setFocusArm(true)
  }

  function addProduct() {
    updateProducts([...draft.products, newProductCompetitor()])
    setFocusProduct(true)
  }

  function onArmKeyDown(e: KeyboardEvent, isLast: boolean) {
    if (e.key === 'Enter' && isLast) {
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
        arm_label: a.arm_label.startsWith('arm_') ? `arm_${i + 1}` : a.arm_label,
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

  const stripItem = (ok: boolean, text: string): CSSProperties => ({
    fontSize: 12,
    fontWeight: 500,
    color: ok ? 'var(--sage)' : 'var(--red)',
  })

  return (
    <section style={sectionCard} id="concept-field">
      <div style={sectionEyebrow}>Section 1</div>
      <h1 style={sectionTitle}>Field</h1>
      <p style={sectionHelp}>
        Build the competitive set. Your concept arms stay private; real products are
        snapshotted by value at publish.
      </p>

      <div style={{ marginBottom: 22 }}>
        <label style={labelSm} htmlFor="concept-title">
          Study title
        </label>
        <input
          id="concept-title"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="e.g. Midnight snack concept — Q3"
          style={{ ...inputBase, fontSize: 15, padding: '11px 12px' }}
        />
      </div>

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
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  padding: '8px 14px',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.4 }}>
          {pricePostureHelp(draft.pricePosture)}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* LEFT — concept arms */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  marginBottom: 2,
                }}
              >
                Your concept arms
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
                Private · IP-firewalled
              </div>
            </div>
            <button type="button" onClick={addArm} style={ghostLink}>
              + Add concept arm
            </button>
          </div>

          {draft.conceptArms.map((arm, index) => {
            const isLast = index === draft.conceptArms.length - 1
            return (
              <div
                key={arm.localId}
                draggable
                onDragStart={() => setDragArmId(arm.localId)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragArmId) reorderArms(dragArmId, arm.localId)
                  setDragArmId(null)
                }}
                style={competitorCard}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <DragHandle />
                  <span style={intentTagStyle(arm.battle_intent)}>
                    {intentLabel(arm.battle_intent)}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    aria-label="Delete concept arm"
                    onClick={() =>
                      updateArms(draft.conceptArms.filter((a) => a.localId !== arm.localId))
                    }
                    style={trashBtn}
                  >
                    <TrashIcon />
                  </button>
                </div>

                <label style={labelSm}>Display name</label>
                <input
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
                  style={{ ...inputBase, marginBottom: 10 }}
                />

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <label style={labelSm}>Stimulus</label>
                    <select
                      value={arm.stimulus_type}
                      onChange={(e) => {
                        const next = draft.conceptArms.map((a) =>
                          a.localId === arm.localId
                            ? { ...a, stimulus_type: e.target.value as StimulusType }
                            : a
                        )
                        updateArms(next)
                      }}
                      style={selectBase}
                    >
                      {STIMULUS_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelSm}>Price</label>
                    <input
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
                </div>

                <label style={labelSm}>Role</label>
                <select
                  value={arm.battle_intent}
                  onChange={(e) => {
                    const next = draft.conceptArms.map((a) =>
                      a.localId === arm.localId
                        ? { ...a, battle_intent: e.target.value as BattleIntent }
                        : a
                    )
                    updateArms(next)
                  }}
                  style={selectBase}
                >
                  {BATTLE_INTENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        {/* RIGHT — real products */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  marginBottom: 2,
                }}
              >
                Real-product competitors
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
                Search · snapshot by value
              </div>
            </div>
            <button type="button" onClick={addProduct} style={ghostLink}>
              + Add competitor
            </button>
          </div>

          {draft.products.length === 0 ? (
            <div
              style={{
                border: '1px dashed var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '28px 16px',
                textAlign: 'center',
                color: 'var(--ink-30)',
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              No real-product competitors yet.
              <div>
                <button type="button" onClick={addProduct} style={{ ...ghostLink, marginTop: 8 }}>
                  + Add competitor
                </button>
              </div>
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

      {/* Live validity strip */}
      <div
        style={{
          marginTop: 22,
          padding: '12px 14px',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-1)',
          border: '1px solid var(--ink-10)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 22px',
          alignItems: 'center',
        }}
      >
        <span style={stripItem(validity.competitorCount >= 2 && validity.conceptArmCount >= 1, '')}>
          {validity.competitorCount >= 2 && validity.conceptArmCount >= 1 ? '✓' : '✗'}{' '}
          {validity.competitorCount} competitor{validity.competitorCount === 1 ? '' : 's'}
          {validity.conceptArmCount < 1 ? ' · need ≥1 arm' : ''}
        </span>
        <span style={stripItem(validity.pairings > 0, '')}>
          {validity.pairings > 0 ? '✓' : '✗'} {validity.pairings} pairing
          {validity.pairings === 1 ? '' : 's'}/respondent
        </span>
        <span style={stripItem(validity.priceOk, '')}>
          {validity.priceOk ? '✓' : '✗'} {validity.priceMessage.replace(/^[✓✗]\s*/, '')}
        </span>
        <span style={stripItem(validity.intentsOk, '')}>
          {validity.intentsOk ? '✓' : '✗'}{' '}
          {validity.intentsOk ? 'roles set' : 'every competitor needs a role'}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--red)' }}
        >
          {error}
        </p>
      ) : null}
    </section>
  )
}

function ProductCompetitorCard({
  row,
  focusRef,
  pricePosture,
  onChange,
  onDelete,
  onKeyDown,
  onDragStart,
  onDrop,
}: {
  row: ProductCompetitorRow
  focusRef: Ref<HTMLInputElement> | null
  pricePosture: PricePosture
  onChange: (row: ProductCompetitorRow) => void
  onDelete: () => void
  onKeyDown: (e: KeyboardEvent) => void
  onDragStart: () => void
  onDrop: () => void
}) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminProductSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2 || row.product_id != null) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await supabase.rpc('search_products_admin', { p_query: q })
        setResults((data ?? []) as AdminProductSearchResult[])
        setOpen(true)
      } finally {
        setSearching(false)
      }
    }, 240)
    return () => clearTimeout(t)
  }, [query, row.product_id, supabase])

  function pick(p: AdminProductSearchResult) {
    onChange({
      ...row,
      product_id: p.product_id,
      frozen_display_name: p.product_name_clean,
      frozen_brand_name: p.brand_name,
      frozen_image_url: null,
      frozen_price: row.frozen_price,
    })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function clearProduct() {
    onChange({
      ...row,
      product_id: null,
      frozen_display_name: '',
      frozen_brand_name: '',
      frozen_image_url: null,
    })
    setQuery('')
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={competitorCard}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <DragHandle />
        <span style={intentTagStyle(row.battle_intent)}>
          {intentLabel(row.battle_intent)}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" aria-label="Delete competitor" onClick={onDelete} style={trashBtn}>
          <TrashIcon />
        </button>
      </div>

      {row.product_id != null ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 10,
            padding: '8px 10px',
            background: 'var(--white)',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{row.frozen_display_name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 2 }}>
              {row.frozen_brand_name}
            </div>
          </div>
          <button type="button" onClick={clearProduct} style={{ ...ghostLink, fontSize: 11 }}>
            Change
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <label style={labelSm}>Product search</label>
          <input
            ref={focusRef ?? undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search products…"
            style={inputBase}
            autoComplete="off"
          />
          {open && (results.length > 0 || searching) ? (
            <div
              style={{
                position: 'absolute',
                zIndex: 20,
                left: 0,
                right: 0,
                top: '100%',
                marginTop: 4,
                background: 'var(--white)',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                maxHeight: 220,
                overflow: 'auto',
                boxShadow: '0 8px 24px rgba(28,38,32,0.08)',
              }}
            >
              {searching ? (
                <div style={{ padding: 10, fontSize: 12, color: 'var(--ink-30)' }}>
                  Searching…
                </div>
              ) : (
                results.slice(0, 8).map((p) => (
                  <button
                    key={p.product_id}
                    type="button"
                    onClick={() => pick(p)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid var(--ink-10)',
                      background: 'transparent',
                      padding: '9px 11px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{p.product_name_clean}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 2 }}>
                      {p.brand_name}
                      {p.l3_name ? ` · ${p.l3_name}` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        <div>
          <label style={labelSm}>Price</label>
          <input
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
            style={inputBase}
          />
        </div>
        <div>
          <label style={labelSm}>Role</label>
          <select
            value={row.battle_intent}
            onChange={(e) =>
              onChange({ ...row, battle_intent: e.target.value as BattleIntent })
            }
            style={selectBase}
          >
            {BATTLE_INTENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
