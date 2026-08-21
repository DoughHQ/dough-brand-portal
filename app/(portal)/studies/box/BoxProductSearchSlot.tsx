'use client'

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase'
import type { AdminProductSearchResult } from '@/lib/queries'
import { useTypeahead } from '@/lib/concept/useTypeahead'
import {
  barcodeDigits,
  isBarcodeSearchReady,
  knownUpcFromBarcodeResolve,
  looksLikeBarcode,
  searchProductsByBarcode,
  type ResolveProductByBarcodeHit,
} from '@/lib/concept/barcodes'
import {
  resolveEntryMode,
  type ProductEntryMode,
} from '@/lib/productEntryMode'
import SuggestionDropdown from '../concept/SuggestionDropdown'
import ProductEntryModeToggle from '../ProductEntryModeToggle'

type Props = {
  /** Product ids already used (focal + field), as strings. Disabled in the list. */
  taken: Set<string>
  onPick: (product: AdminProductSearchResult, knownUpc?: string) => void
  onCancel?: () => void
  placeholder?: string
  /** L2 node id to surface first ("encourage same area"). null = no preference. */
  preferL2NodeId?: number | null
  autoFocus?: boolean
  /** Name/Barcode toggle. On for hero and fill-the-box. */
  entryModes?: boolean
}

function hitToSearchResult(hit: ResolveProductByBarcodeHit): AdminProductSearchResult {
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
  }
}

export default function BoxProductSearchSlot({
  taken,
  onPick,
  onCancel,
  placeholder = 'Search by name, brand, or barcode…',
  preferL2NodeId = null,
  autoFocus = true,
  entryModes = true,
}: Props) {
  const supabase = createClient()
  const listId = useId()
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const barcodeUpcRef = useRef<Map<number, string>>(new Map())
  const [explicitMode, setExplicitMode] = useState<ProductEntryMode | null>(null)

  const fetchProducts = useCallback(
    async (q: string, _signal: AbortSignal): Promise<AdminProductSearchResult[]> => {
      barcodeUpcRef.current = new Map()
      const mode = entryModes
        ? resolveEntryMode(explicitMode, q)
        : looksLikeBarcode(q)
          ? 'barcode'
          : 'name'
      if (mode === 'barcode') {
        if (!isBarcodeSearchReady(q)) return []
        const resolved = await searchProductsByBarcode(supabase, q)
        if (resolved.found && resolved.products.length > 0) {
          return resolved.products.map((hit) => {
            const known = knownUpcFromBarcodeResolve(resolved, hit)
            if (known) barcodeUpcRef.current.set(hit.product_id, known)
            return hitToSearchResult(hit)
          })
        }
        return []
      }
      const { data, error } = await supabase.rpc('search_products_admin', { p_query: q })
      if (error) throw error
      const rows = (data ?? []) as AdminProductSearchResult[]
      if (preferL2NodeId != null) {
        const same = rows.filter((r) => r.l2_node_id === preferL2NodeId)
        const other = rows.filter((r) => r.l2_node_id !== preferL2NodeId)
        return [...same, ...other].slice(0, 8)
      }
      return rows.slice(0, 8)
    },
    [supabase, preferL2NodeId, entryModes, explicitMode]
  )

  const ta = useTypeahead<AdminProductSearchResult>(fetchProducts, { minChars: 2 })

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (!ta.open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) ta.close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [ta.open, ta.close])

  function pickProduct(item: AdminProductSearchResult) {
    if (taken.has(String(item.product_id))) return
    onPick(item, barcodeUpcRef.current.get(item.product_id))
    ta.reset()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!ta.open) ta.setOpen(true)
      ta.setActiveIndex(Math.min(ta.activeIndex + 1, Math.max(ta.results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      ta.setActiveIndex(Math.max(ta.activeIndex - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = ta.results[ta.activeIndex]
      if (item && ta.status === 'success') pickProduct(item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (ta.open) ta.close()
      else onCancel?.()
    }
  }

  const showDropdown = ta.open && ta.status !== 'idle'
  const mode = entryModes
    ? resolveEntryMode(explicitMode, ta.query)
    : looksLikeBarcode(ta.query)
      ? 'barcode'
      : 'name'
  const barcodeQuery = mode === 'barcode'
  const digitsTyped = barcodeDigits(ta.query).length
  const barcodeTooShort = barcodeQuery && !isBarcodeSearchReady(ta.query)
  const fieldPlaceholder =
    entryModes && mode === 'barcode'
      ? 'Enter the barcode on the package…'
      : entryModes
        ? 'Search by name or brand…'
        : placeholder

  useEffect(() => {
    if (!entryModes) return
    ta.retry()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when the operator forces a mode
  }, [explicitMode, entryModes])

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      {entryModes ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ProductEntryModeToggle mode={mode} onChange={setExplicitMode} />
        </div>
      ) : null}
      <input
        id={inputId}
        ref={inputRef}
        className="cb-input"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showDropdown && ta.status === 'success' && ta.results[ta.activeIndex]
            ? `${listId}-opt-${ta.results[ta.activeIndex]!.product_id}`
            : undefined
        }
        value={ta.query}
        placeholder={fieldPlaceholder}
        autoComplete="off"
        inputMode={barcodeQuery ? 'numeric' : undefined}
        onChange={(e) => ta.setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (ta.query.trim().length >= 2) ta.setOpen(true)
        }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: 48,
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-sm)',
          padding: '0 16px',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink)',
          background: 'var(--white)',
          outline: 'none',
        }}
      />
      {showDropdown ? (
        <SuggestionDropdown<AdminProductSearchResult>
          id={listId}
          status={ta.status}
          results={ta.results}
          activeIndex={ta.activeIndex}
          onActiveIndex={ta.setActiveIndex}
          onSelect={pickProduct}
          onRetry={ta.retry}
          getKey={(item) => item.product_id}
          isDisabled={(item) => taken.has(String(item.product_id))}
          emptyLabel={
            barcodeTooShort
              ? 'Keep typing the full barcode (8–14 digits).'
              : barcodeQuery
                ? 'No product matches that barcode.'
                : 'No products match — try a different name.'
          }
          emptyHint={
            barcodeTooShort
              ? `${digitsTyped} digit${digitsTyped === 1 ? '' : 's'} so far.`
              : barcodeQuery
                ? 'Check the digits against the package, or switch to Name.'
                : undefined
          }
          errorLabel="Barcode lookup failed — tap to retry"
          renderItem={(item) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt=""
                  width={28}
                  height={28}
                  style={{
                    width: 28,
                    height: 28,
                    objectFit: 'contain',
                    background: 'var(--surface-1)',
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span
                  aria-hidden
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    background: 'var(--surface-1)',
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 500, color: 'var(--ink)' }}>
                  {item.product_name_clean}
                </span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-50)' }}>
                  {item.brand_name}
                  {item.l3_name ? ` · ${item.l3_name}` : ''}
                  {taken.has(String(item.product_id)) ? ' · already in box' : ''}
                </span>
              </span>
            </span>
          )}
        />
      ) : null}
    </div>
  )
}
