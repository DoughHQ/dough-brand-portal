import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchDeclarableFacets } from '@/lib/facets/api'
import {
  listShopperFacets,
  rowIsPickerEditable,
  type DeclarableFacetRow,
} from '@/lib/facets/productFacets'
import { type EditorProps, sectionHasContent, sortOpenAttributes } from './attributesModel'

export type ProductAttributesState = ReturnType<typeof useProductAttributes>

export function useProductAttributes({
  productId,
  onChanged,
}: Pick<EditorProps, 'productId' | 'onChanged'>) {
  const [rows, setRows] = useState<DeclarableFacetRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [openAdd, setOpenAdd] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const facets = await fetchDeclarableFacets(supabase, productId)
    if (facets.error) setError(facets.error)
    setRows(facets.rows)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  const { known, claims, empty } = useMemo(() => {
    const list = rows ?? []
    const knownRows: DeclarableFacetRow[] = []
    const claimRows: DeclarableFacetRow[] = []
    const emptyRows: DeclarableFacetRow[] = []
    for (const r of list) {
      const has = sectionHasContent(r)
      const picker = rowIsPickerEditable(r)
      if (has && !picker) knownRows.push(r)
      else if (has && picker) claimRows.push(r)
      else if (picker) emptyRows.push(r)
    }
    emptyRows.sort(sortOpenAttributes)
    // Keep Flavour Notes near the top of active claims too.
    claimRows.sort((a, b) => {
      if (a.facet_type === 'flavor_note') return -1
      if (b.facet_type === 'flavor_note') return 1
      return 0
    })
    return { known: knownRows, claims: claimRows, empty: emptyRows }
  }, [rows])

  const shopperItems = useMemo(() => (rows ? listShopperFacets(rows) : []), [rows])

  const refreshAfterWrite = async () => {
    await load()
    onChanged?.()
  }

  const hasAny = known.length + claims.length + empty.length > 0

  return {
    rows,
    loading,
    error,
    setError,
    busyKey,
    setBusyKey,
    openAdd,
    setOpenAdd,
    known,
    claims,
    empty,
    shopperItems,
    refreshAfterWrite,
    hasAny,
  }
}
