'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { AdminProductSearchResult } from '@/lib/queries'
import type { ProductBarcodeOption, ProductCompetitorRow } from '@/lib/concept/types'
import { newProductCompetitor } from '@/lib/concept/defaults'
import type { AddAvailability } from '@/lib/concept/fieldSize'
import { loadProductBarcodeState } from '@/lib/concept/barcodes'
import { FIELD_ADD_COMPETITOR_EVENT } from '@/lib/concept/studyMasthead'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import { categoryFromSearchResult } from '@/lib/productEntryMode'

export function useCompetitorColumn({
  products,
  onProductsChange,
  addAvailability,
  disabled,
}: {
  products: ProductCompetitorRow[]
  onProductsChange: (next: ProductCompetitorRow[]) => void
  addAvailability: AddAvailability
  disabled?: boolean
}) {
  /** Snapshot of the row being replaced, so Change can be cancelled without data loss. */
  const [changing, setChanging] = useState<{ localId: string; prev: ProductCompetitorRow } | null>(
    null
  )
  /**
   * The add flow is transient local state — it never writes an unresolved row into the
   * draft, so an open search box can never occupy one of the five field seats.
   */
  const [adding, setAdding] = useState(false)

  const selected = products.filter((p) => p.product_id != null)
  const taken = new Set(selected.map((p) => String(p.product_id)))

  function openAdd() {
    if (!addAvailability.allowed) return
    setAdding(true)
  }

  const mastheadAddRef = useRef<() => void>(() => {})
  mastheadAddRef.current = () => {
    if (disabled) return
    openAdd()
  }

  useEffect(() => {
    const root = document.getElementById(CONCEPT_ANCHORS.field)
    if (!root) return
    function onMastheadAdd() {
      mastheadAddRef.current()
    }
    root.addEventListener(FIELD_ADD_COMPETITOR_EVENT, onMastheadAdd)
    return () => root.removeEventListener(FIELD_ADD_COMPETITOR_EVENT, onMastheadAdd)
  }, [])

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

  return {
    changing,
    adding,
    taken,
    openAdd,
    setAdding,
    addResolved,
    removeRow,
    patchRow,
    beginChange,
    cancelSlot,
    pick,
  }
}
