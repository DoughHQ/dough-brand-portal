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
import { useTypeahead } from '@/lib/concept/useTypeahead'
import {
  barcodeDigits,
  isBarcodeSearchReady,
  knownUpcFromBarcodeResolve,
  searchProductsByBarcode,
} from '@/lib/concept/barcodes'
import {
  resolveEntryMode,
  type ProductEntryMode,
} from '@/lib/productEntryMode'
import SuggestionDropdown from '../SuggestionDropdown'
import { inputBase, labelSm } from '../conceptStyles'
import ProductEntryModeToggle from '../../ProductEntryModeToggle'

const resultThumb = {
  width: 34,
  height: 34,
  flexShrink: 0,
  objectFit: 'contain' as const,
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-media)',
}

export default function CompetitorSearchSlot({
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
