'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createClient } from '@/lib/supabase'
import type { AdminProductSearchResult } from '@/lib/queries'
import type { PricePosture, ProductBarcodeOption, ProductCompetitorRow } from '@/lib/concept/types'
import { newProductCompetitor } from '@/lib/concept/defaults'
import type { AddAvailability } from '@/lib/concept/fieldSize'
import { isAllowedPriceInput } from '@/lib/concept/price'
import { useTypeahead } from '@/lib/concept/useTypeahead'
import {
  barcodeChoiceLabel,
  barcodeDigits,
  isBarcodeSearchReady,
  knownUpcFromBarcodeResolve,
  loadProductBarcodeState,
  searchProductsByBarcode,
} from '@/lib/concept/barcodes'
import { CONCEPT_UPC_IDENTITY_HELP } from '@/lib/concept/constants'
import {
  categoryFromSearchResult,
  isIdentityConfirmed,
  resolveEntryMode,
  type ProductEntryMode,
} from '@/lib/productEntryMode'
import SuggestionDropdown from './SuggestionDropdown'
import { TrashIcon } from './fieldIcons'
import { inputBase, labelSm } from './conceptStyles'
import ProductEntryModeToggle from '../ProductEntryModeToggle'
import ProductIdentityConfirm from '../ProductIdentityConfirm'

/**
 * Section 1 · right column — "Competitors".
 *
 * The persistent object is the competitive set. Product search is temporary tooling
 * used to add or replace one member of that set, and collapses once it has done its job.
 *
 * Backend semantics preserved exactly: a competitor is only ever a row resolved from
 * `search_products_admin`, snapshotted into frozen_* fields. A row with `product_id: null`
 * is an unfinished slot — it is never published and still blocks publish via the existing
 * `productIntentsOk` rule, exactly as before.
 */

type Props = {
  products: ProductCompetitorRow[]
  onProductsChange: (next: ProductCompetitorRow[]) => void
  /** Standalone price study — validity requires at least one real competitor. */
  priceMode: boolean
  /** Packaging / price force blind: no per-competitor price in those modes. */
  hidePrice: boolean
  showMarketPrice?: boolean
  pricePosture: PricePosture
  /** Authoritative field-capacity verdict — owned by lib/concept/fieldSize. */
  addCompetitor: AddAvailability
  /** Authoritative mode-aware progress copy — owned by lib/concept/fieldSize. */
  progressLabel: string
  disabled?: boolean
  /** localId → inline UPC / duplicate error on the competitor card. */
  rowErrors?: Record<string, string>
}

export default function CompetitorsColumn({
  products,
  onProductsChange,
  priceMode,
  hidePrice,
  showMarketPrice,
  pricePosture,
  addCompetitor: addAvailability,
  progressLabel,
  disabled,
  rowErrors = {},
}: Props) {
  /** Snapshot of the row being replaced, so Change can be cancelled without data loss. */
  const [changing, setChanging] = useState<{ localId: string; prev: ProductCompetitorRow } | null>(
    null
  )
  /**
   * The add flow is transient local state — it never writes an unresolved row into the
   * draft, so an open search box can never occupy one of the six field seats.
   */
  const [adding, setAdding] = useState(false)

  const selected = products.filter((p) => p.product_id != null)
  const taken = new Set(selected.map((p) => String(p.product_id)))
  const count = selected.length

  function openAdd() {
    if (!addAvailability.allowed) return
    setAdding(true)
  }

  async function hydrateFromPick(
    base: ProductCompetitorRow,
    p: AdminProductSearchResult,
    knownUpc?: string
  ): Promise<ProductCompetitorRow> {
    const supabase = createClient()
    let upc: string | null = knownUpc?.trim() || null
    let barcodeOptions: ProductBarcodeOption[] = []
    try {
      const state = await loadProductBarcodeState(supabase, p.product_id, knownUpc)
      upc = state.upc
      barcodeOptions = state.barcodeOptions
    } catch {
      // Validity will require a UPC; the row is still usable as a product pick.
    }
    return {
      ...base,
      product_id: p.product_id,
      frozen_display_name: p.product_name_clean,
      frozen_brand_name: p.brand_name,
      frozen_image_url: p.image_url ?? null,
      battle_intent: 'competitor',
      upc,
      barcodeOptions,
      frozen_category: categoryFromSearchResult(p),
      identityConfirmed: false,
    }
  }

  function addResolved(p: AdminProductSearchResult, knownUpc?: string) {
    setAdding(false)
    void (async () => {
      const row = await hydrateFromPick(newProductCompetitor(), p, knownUpc)
      onProductsChange([...products, row])
    })()
  }

  function removeRow(localId: string) {
    if (changing?.localId === localId) setChanging(null)
    onProductsChange(products.filter((p) => p.localId !== localId))
  }

  function patchRow(localId: string, next: ProductCompetitorRow) {
    onProductsChange(products.map((p) => (p.localId === localId ? next : p)))
  }

  function beginChange(row: ProductCompetitorRow) {
    setChanging({ localId: row.localId, prev: row })
    patchRow(row.localId, {
      ...row,
      product_id: null,
      frozen_display_name: '',
      frozen_brand_name: '',
      frozen_image_url: null,
      upc: null,
      barcodeOptions: [],
      frozen_category: null,
      identityConfirmed: false,
    })
  }

  function cancelSlot(row: ProductCompetitorRow) {
    if (changing && changing.localId === row.localId) {
      patchRow(row.localId, changing.prev)
      setChanging(null)
      return
    }
    removeRow(row.localId)
  }

  function pick(row: ProductCompetitorRow, p: AdminProductSearchResult, knownUpc?: string) {
    if (changing?.localId === row.localId) setChanging(null)
    void (async () => {
      const next = await hydrateFromPick(row, p, knownUpc)
      patchRow(row.localId, next)
    })()
  }

  return (
    <>
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
              Add the real products shoppers would compare yours against.
            </div>
          </div>
          {products.length > 0 || adding ? (
            <button
              type="button"
              onClick={openAdd}
              className="cb-btn-outline"
              disabled={disabled || adding || !addAvailability.allowed}
              aria-describedby={addAvailability.allowed ? undefined : 'cb-add-competitor-reason'}
            >
              + Add competitor
            </button>
          ) : null}
        </div>
        <p
          role="status"
          style={{ margin: 0, fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}
        >
          {progressLabel}
        </p>
        {!addAvailability.allowed && (products.length > 0 || adding) ? (
          <p
            id="cb-add-competitor-reason"
            style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.45 }}
          >
            {addAvailability.message}
          </p>
        ) : null}
      </div>

      <div className="cb-field-body-right">
        {products.length === 0 && !adding ? (
          <div
            style={{
              border: 'var(--cb-border-dashed)',
              borderRadius: 'var(--r-lg)',
              background: 'var(--cb-surface-muted)',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <ShelfGlyph />
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink-80)',
                marginBottom: 8,
              }}
            >
              Add competitors
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
              Search Dough&rsquo;s product database for the products shoppers would see as
              alternatives.
            </p>
            <button
              type="button"
              className="cb-btn-outline"
              onClick={openAdd}
              disabled={disabled || !addAvailability.allowed}
            >
              + Add competitor
            </button>
          </div>
        ) : (
          <div className="cb-comp-list">
            {products.map((row) =>
              row.product_id != null ? (
                <SelectedCompetitor
                  key={row.localId}
                  row={row}
                  hidePrice={hidePrice}
                  showMarketPrice={priceMode}
                  pricePosture={pricePosture}
                  error={rowErrors[row.localId]}
                  onChangeRow={(next) => patchRow(row.localId, next)}
                  onPatch={(patch) =>
                    patchRow(row.localId, { ...row, ...patch })
                  }
                  onReplace={() => beginChange(row)}
                  onRemove={() => removeRow(row.localId)}
                />
              ) : (
                <CompetitorSearchSlot
                  key={row.localId}
                  isReplace={changing?.localId === row.localId}
                  taken={taken}
                  onPick={(p, upc) => pick(row, p, upc)}
                  onCancel={() => cancelSlot(row)}
                />
              )
            )}
            {adding ? (
              <CompetitorSearchSlot
                key="transient-add"
                isReplace={false}
                taken={taken}
                onPick={(p, upc) => addResolved(p, upc)}
                onCancel={() => setAdding(false)}
              />
            ) : null}
          </div>
        )}
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- selected row */

function SelectedCompetitor({
  row,
  hidePrice,
  showMarketPrice,
  pricePosture,
  onChangeRow,
  onPatch,
  onReplace,
  onRemove,
  error,
}: {
  row: ProductCompetitorRow
  hidePrice: boolean
  showMarketPrice?: boolean
  pricePosture: PricePosture
  error?: string
  onChangeRow: (next: ProductCompetitorRow) => void
  onPatch: (patch: Partial<ProductCompetitorRow>) => void
  onReplace: () => void
  onRemove: () => void
}) {
  const [imgFailed, setImgFailed] = useState(false)
  useEffect(() => {
    setImgFailed(false)
  }, [row.product_id, row.frozen_image_url])

  useEffect(() => {
    if (row.product_id == null) return
    if (row.upc) return
    if ((row.barcodeOptions?.length ?? 0) > 0) return
    const productId = row.product_id
    let cancelled = false
    void (async () => {
      try {
        const state = await loadProductBarcodeState(createClient(), productId)
        if (cancelled) return
        onPatch({ upc: state.upc, barcodeOptions: state.barcodeOptions })
      } catch {
        /* validity will surface the missing SKU */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per unresolved product
  }, [row.product_id, row.upc, row.barcodeOptions?.length])

  const name = row.frozen_display_name || 'Untitled product'
  const barcodeOptions = row.barcodeOptions ?? []
  const awaitingConfirm = !!row.upc?.trim() && !isIdentityConfirmed(row)

  return (
    <div
      className="cb-comp-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        outline: error ? '1px solid var(--red)' : undefined,
        outlineOffset: error ? -1 : undefined,
      }}
    >
      {row.frozen_image_url && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.frozen_image_url}
          alt=""
          onError={() => setImgFailed(true)}
          style={thumbStyle}
        />
      ) : (
        <div style={{ ...thumbStyle, borderStyle: 'dashed', borderColor: 'var(--cb-border-strong)' }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink-80)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 4 }}>
          {row.frozen_brand_name}
        </div>
        <div style={{ marginTop: 10 }}>
          {awaitingConfirm && row.upc ? (
            <ProductIdentityConfirm
              name={name}
              brand={row.frozen_brand_name}
              category={row.frozen_category ?? null}
              upc={row.upc}
              help={CONCEPT_UPC_IDENTITY_HELP}
              onConfirm={() => onPatch({ identityConfirmed: true })}
              onChange={onReplace}
            />
          ) : barcodeOptions.length > 1 && !row.upc ? (
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ ...labelSm, marginBottom: 6 }}>Which SKU was tested?</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {barcodeOptions.map((opt) => (
                  <label
                    key={opt.barcode}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 13,
                      color: 'var(--ink-80)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name={`upc-${row.localId}`}
                      value={opt.barcode}
                      checked={row.upc === opt.barcode}
                      onChange={() => onPatch({ upc: opt.barcode })}
                      style={{ marginTop: 3 }}
                    />
                    <span>{barcodeChoiceLabel(opt)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-80)' }}>
              {row.upc ? `UPC ${row.upc}` : 'SKU not identified yet'}
            </div>
          )}
          {!awaitingConfirm ? (
            <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--cb-secondary)' }}>
              {CONCEPT_UPC_IDENTITY_HELP}
            </p>
          ) : null}
          {error && !awaitingConfirm ? (
            <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--red)' }}>
              {error}
            </p>
          ) : null}
        </div>
        {!hidePrice && !awaitingConfirm ? (
          <input
            className="cb-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`Price for ${name}`}
            value={row.frozen_price ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              if (!isAllowedPriceInput(raw)) return
              onChangeRow({ ...row, frozen_price: raw.trim() === '' ? null : raw })
            }}
            placeholder={pricePosture === 'blind' ? '—' : '4.99'}
            style={{ ...inputBase, height: 36, marginTop: 8, maxWidth: 120 }}
          />
        ) : null}
        {/* Price studies derive the WTP ladder from real shelf prices. Restored
            here when the competitor rows moved out of FieldSection in Pass 4B. */}
        {showMarketPrice && !awaitingConfirm ? (
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
                onChangeRow({
                  ...row,
                  market_reference_price: raw.trim() === '' ? null : raw,
                })
              }}
              placeholder="4.99"
              style={{ ...inputBase, height: 36, maxWidth: 120 }}
            />
            <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--cb-secondary)' }}>
              What it actually sells for. Sets the willingness-to-pay range from the
              real shelf instead of your expected price. Never shown to respondents.
            </p>
          </div>
        ) : null}
      </div>

      {!awaitingConfirm ? (
        <button
          type="button"
          onClick={onReplace}
          className="cb-btn-change"
          aria-label={`Change ${name}`}
        >
          Change
        </button>
      ) : null}
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-50)',
          padding: 4,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <TrashIcon />
      </button>
    </div>
  )
}

const thumbStyle = {
  width: 64,
  height: 64,
  flexShrink: 0,
  objectFit: 'contain' as const,
  display: 'block',
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-media)',
}

/* ------------------------------------------------------------ add / replace */

function CompetitorSearchSlot({
  isReplace,
  taken,
  onPick,
  onCancel,
}: {
  isReplace: boolean
  taken: Set<string>
  onPick: (p: AdminProductSearchResult, knownUpc?: string) => void
  onCancel: () => void
}) {
  const supabase = createClient()
  const listId = useId()
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const barcodeUpcRef = useRef<Map<number, string>>(new Map())
  const [explicitMode, setExplicitMode] = useState<ProductEntryMode | null>(null)

  const fetchCompetitors = useCallback(
    async (q: string, _signal: AbortSignal) => {
      barcodeUpcRef.current = new Map()
      const mode = resolveEntryMode(explicitMode, q)
      if (mode === 'barcode') {
        if (!isBarcodeSearchReady(q)) return []
        const resolved = await searchProductsByBarcode(supabase, q)
        if (resolved.found && resolved.products.length > 0) {
          return resolved.products.map((hit) => {
            const known = knownUpcFromBarcodeResolve(resolved, hit)
            if (known) barcodeUpcRef.current.set(hit.product_id, known)
            return {
              product_id: hit.product_id,
              product_name_clean: hit.product_name,
              brand_name: hit.brand_name,
              brand_id: 0,
              l2_name: null,
              l3_name: hit.category,
              battles_total: 0,
              win_rate_pct: null,
              elo_score: null,
              milestone: '',
              image_url: hit.image_url,
              taxonomy_node_id: hit.taxonomy_node_id,
              l2_node_id: null,
              l1_name: null,
            } satisfies AdminProductSearchResult
          })
        }
        return []
      }
      const { data, error } = await supabase.rpc('search_products_admin', { p_query: q })
      if (error) throw error
      return ((data ?? []) as AdminProductSearchResult[]).slice(0, 8)
    },
    [supabase, explicitMode]
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
    retry,
    close,
  } = useTypeahead<AdminProductSearchResult>(fetchCompetitors, { enabled: true })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  function pickProduct(p: AdminProductSearchResult) {
    onPick(p, barcodeUpcRef.current.get(p.product_id))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (open) close()
      else onCancel()
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
      if (hit && status === 'success' && !taken.has(String(hit.product_id))) {
        e.preventDefault()
        pickProduct(hit)
      }
    }
  }

  const showDropdown = open && status !== 'idle'
  const mode = resolveEntryMode(explicitMode, query)
  const barcodeTooShort = mode === 'barcode' && !isBarcodeSearchReady(query)
  const digitsTyped = barcodeDigits(query).length

  useEffect(() => {
    retry()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explicitMode])

  return (
    <div className="cb-comp-row" style={{ padding: 16 }} ref={rootRef}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-80)',
          marginBottom: 12,
        }}
      >
        {isReplace ? 'Change competitor' : 'Add competitor'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <label style={{ ...labelSm, marginBottom: 0 }} htmlFor={inputId}>
          Search products
        </label>
        <ProductEntryModeToggle mode={mode} onChange={setExplicitMode} />
      </div>
      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          ref={inputRef}
          className="cb-input"
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
          onKeyDown={onKeyDown}
          placeholder={
            mode === 'barcode'
              ? 'Enter the competitor barcode…'
              : 'Search by product or brand…'
          }
          autoComplete="off"
          inputMode={mode === 'barcode' ? 'numeric' : undefined}
          style={inputBase}
        />
        {showDropdown ? (
          <SuggestionDropdown
            id={listId}
            status={status}
            results={results}
            activeIndex={activeIndex}
            onActiveIndex={setActiveIndex}
            onSelect={pickProduct}
            onRetry={retry}
            getKey={(p) => p.product_id}
            isDisabled={(p) => taken.has(String(p.product_id))}
            emptyLabel={
              barcodeTooShort
                ? 'Keep typing the full barcode (8–14 digits).'
                : mode === 'barcode'
                  ? 'No product matches that barcode.'
                  : 'No matching products'
            }
            emptyHint={
              barcodeTooShort
                ? `${digitsTyped} digit${digitsTyped === 1 ? '' : 's'} so far.`
                : mode === 'barcode'
                  ? 'Check the digits against the package, or switch to Name.'
                  : 'Try another product or brand name.'
            }
            errorLabel="Barcode lookup failed. Try again."
            renderItem={(p) => {
              const already = taken.has(String(p.product_id))
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" style={resultThumb} />
                  ) : (
                    <div
                      style={{
                        ...resultThumb,
                        border: 'var(--cb-border-dashed)',
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{p.product_name_clean}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 4 }}>
                      {p.brand_name}
                      {p.l3_name ? ` · ${p.l3_name}` : ''}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: already ? 500 : 600,
                      color: already ? 'var(--ink-50)' : 'var(--sage)',
                    }}
                  >
                    {already ? 'Already added' : 'Add'}
                  </span>
                </div>
              )
            }}
          />
        ) : null}
      </div>

      <button
        type="button"
        onClick={onCancel}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-50)',
          padding: '8px 0',
          marginTop: 8,
        }}
      >
        Cancel
      </button>
    </div>
  )
}

const resultThumb = {
  width: 34,
  height: 34,
  flexShrink: 0,
  objectFit: 'contain' as const,
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-media)',
}

function ShelfGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block', margin: '0 auto 12px', color: 'var(--ink-50)' }}
    >
      <rect x="2.75" y="6.75" width="7" height="12.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="14.25" y="3.75" width="7" height="15.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 21.25h21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
