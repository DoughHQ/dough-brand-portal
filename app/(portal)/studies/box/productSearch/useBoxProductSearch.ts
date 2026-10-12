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

export function useBoxProductSearch({
  taken,
  onPick,
  onCancel,
  placeholder = 'Search by name, brand, or barcode…',
  preferL2NodeId = null,
  autoFocus = true,
  entryModes = true,
}: {
  taken: Set<string>
  onPick: (product: AdminProductSearchResult, knownUpc?: string) => void
  onCancel?: () => void
  placeholder?: string
  preferL2NodeId?: number | null
  autoFocus?: boolean
  entryModes?: boolean
}) {
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
  const { open: typeaheadOpen, close: closeTypeahead } = ta

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (!typeaheadOpen) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeTypeahead()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [typeaheadOpen, closeTypeahead])

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

  return {
    listId,
    inputId,
    rootRef,
    inputRef,
    setExplicitMode,
    ta,
    pickProduct,
    handleKeyDown,
    showDropdown,
    mode,
    barcodeQuery,
    digitsTyped,
    barcodeTooShort,
    fieldPlaceholder,
    entryModes,
  }
}
