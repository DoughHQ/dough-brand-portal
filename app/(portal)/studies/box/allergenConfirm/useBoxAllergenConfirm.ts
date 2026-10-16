'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { BoxFieldRow } from '@/lib/box/types'
import {
  isAllergenConfirmed,
  parseAllergenPrefill,
  type AllergenCode,
} from '@/lib/box/allergens'

export function useBoxAllergenConfirm(
  row: BoxFieldRow,
  onChange: (next: BoxFieldRow) => void,
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const confirmed = isAllergenConfirmed(row)
  const contains = new Set(row.allergensContains ?? [])
  const mayContain = new Set(row.allergensMayContain ?? [])
  const status = row.allergensCatalogStatus
  const needsLabelCheck =
    status === 'unknown' ||
    status === 'incomplete' ||
    status === 'varies_by_variant' ||
    status == null
  const showPicker = !confirmed && (editing || needsLabelCheck)

  useEffect(() => {
    if (row.product_id == null || !row.upc?.trim()) return
    if (confirmed) return
    if (row.allergensContains != null && row.allergensMayContain != null) return

    let cancelled = false
    setLoading(true)
    setError(null)
    const supabase = createClient()
    void supabase
      .rpc('get_product_allergen_prefill' as never, {
        p_product_id: row.product_id,
        p_upc: row.upc.trim(),
      } as never)
      .then(({ data, error: rpcError }) => {
        if (cancelled) return
        if (rpcError) {
          setError(rpcError.message)
          setLoading(false)
          return
        }
        const prefill = parseAllergenPrefill(data)
        if (!prefill) {
          setLoading(false)
          return
        }
        onChange({
          ...row,
          allergensContains: prefill.contains,
          allergensMayContain: prefill.may_contain,
          allergensCatalogStatus: prefill.status,
          allergensConfirmed: false,
        })
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill once per product and upc while lists are still null
  }, [row.product_id, row.upc])

  function toggle(code: AllergenCode, list: 'contains' | 'may') {
    const nextContains = new Set(row.allergensContains ?? [])
    const nextMay = new Set(row.allergensMayContain ?? [])
    if (list === 'contains') {
      if (nextContains.has(code)) nextContains.delete(code)
      else {
        nextContains.add(code)
        nextMay.delete(code)
      }
    } else {
      if (nextMay.has(code)) nextMay.delete(code)
      else {
        nextMay.add(code)
        nextContains.delete(code)
      }
    }
    onChange({
      ...row,
      allergensContains: [...nextContains],
      allergensMayContain: [...nextMay],
      allergensConfirmed: false,
    })
  }

  function confirm() {
    onChange({
      ...row,
      allergensContains: row.allergensContains ?? [],
      allergensMayContain: row.allergensMayContain ?? [],
      allergensConfirmed: true,
    })
    setEditing(false)
  }

  function startEdit() {
    onChange({ ...row, allergensConfirmed: false })
    setEditing(true)
  }

  const help =
    status === 'confident'
      ? 'Catalog match — confirm it matches the package.'
      : needsLabelCheck
        ? 'Check the package label. Catalog data is incomplete or varies.'
        : 'Confirm from the package label.'

  return {
    loading,
    error,
    editing,
    setEditing,
    confirmed,
    contains,
    mayContain,
    needsLabelCheck,
    showPicker,
    help,
    toggle,
    confirm,
    startEdit,
  }
}
