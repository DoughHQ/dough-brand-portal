'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { callWriteRpc, fetchProductMaster } from '@/lib/productMaster/fetch'
import { getHint, humanizeRpcError, type RpcErrorLike } from '@/lib/productMaster/errors'
import type {
  MasterSku,
  ProductMaster,
  RecentChange,
} from '@/lib/productMaster/types'
import {
  correctionTypeSet,
  partitionOpenCorrections,
  pendingFieldSet,
  proposalByFieldMap,
} from '@/lib/productMaster/pendingCorrections'

export type StaleState = {
  fieldName: string
  localValue: unknown
  change: RecentChange | null
  pendingPatch: Record<string, unknown>
  retry: (newRowVersion: number) => Promise<void>
}

export type CompetitorHit = { product_id: number; product_name_display: string }

const STUB_COMPETITORS: CompetitorHit[] = [
  { product_id: 1, product_name_display: 'Nature Valley Sweet & Salty' },
  { product_id: 2, product_name_display: 'KIND Dark Chocolate Nuts' },
  { product_id: 3, product_name_display: 'Clif Bar Chocolate Chip' },
  { product_id: 4, product_name_display: 'RXBAR Peanut Butter' },
  { product_id: 5, product_name_display: 'Larabar Apple Pie' },
]

export function useProductMasterWrites(args: {
  initial: ProductMaster
  effectiveBrandId: number
  canEdit: boolean
  isAdmin: boolean
}) {
  const { initial, effectiveBrandId, canEdit, isAdmin } = args
  const supabase = useMemo(() => createClient(), [])
  const [master, setMaster] = useState(initial)
  const [flash, setFlash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [stale, setStale] = useState<StaleState | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAllNutrients, setShowAllNutrients] = useState<Record<number, boolean>>({})
  const [expandedSkus, setExpandedSkus] = useState<Record<number, boolean>>({})
  const [priceSurface, setPriceSurface] = useState<unknown | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [competitorQuery, setCompetitorQuery] = useState('')
  const [competitorHits, setCompetitorHits] = useState<CompetitorHit[]>([])
  const [competitors, setCompetitors] = useState<CompetitorHit[]>([])
  const [msrpDraft, setMsrpDraft] = useState<Record<number, string>>({})
  const [editingMsrp, setEditingMsrp] = useState<number | null>(null)
  const [editingIngredients, setEditingIngredients] = useState<number | null>(null)
  const [ingredientsDraft, setIngredientsDraft] = useState('')
  const [editingNutritionKey, setEditingNutritionKey] = useState<string | null>(null)
  const [nutritionDraft, setNutritionDraft] = useState('')
  const [uploading, setUploading] = useState(false)

  const product = master.product
  const editable = new Set(master.editable_fields ?? [])

  const { systemFlags, proposals } = useMemo(
    () => partitionOpenCorrections(master.open_corrections),
    [master.open_corrections]
  )
  const correctionTypes = useMemo(() => correctionTypeSet(proposals), [proposals])
  const pendingFields = useMemo(
    () => pendingFieldSet(master.open_corrections),
    [master.open_corrections]
  )
  const proposalByField = useMemo(() => proposalByFieldMap(proposals), [proposals])

  const refetch = useCallback(async () => {
    const result = await fetchProductMaster(supabase, product.product_id)
    if (result.ok) {
      setMaster(result.data)
      return result.data
    }
    setErrorMsg(humanizeRpcError(result.error))
    return null
  }, [supabase, product.product_id])

  function handleWriteError(
    error: RpcErrorLike,
    ctx?: {
      fieldName?: string
      localValue?: unknown
      pendingPatch?: Record<string, unknown>
      retry?: (rv: number) => Promise<void>
    }
  ) {
    const hint = getHint(error)
    if (hint === 'STALE_WRITE') {
      const change =
        master.recent_changes.find((c) => c.field_name === ctx?.fieldName) ??
        master.recent_changes[0] ??
        null
      setStale({
        fieldName: ctx?.fieldName ?? change?.field_name ?? 'field',
        localValue: ctx?.localValue,
        change,
        pendingPatch: ctx?.pendingPatch ?? {},
        retry:
          ctx?.retry ??
          (async () => {
            await refetch()
          }),
      })
      void refetch()
      return
    }
    if (
      hint === 'SKU_NOT_FOUND' ||
      hint === 'NUTRITION_NOT_FOUND' ||
      hint === 'INGREDIENTS_NOT_FOUND'
    ) {
      setFlash(humanizeRpcError(error))
      void refetch()
      return
    }
    if (hint === 'FIELD_NOT_EDITABLE') {
      console.error('[product-master] FIELD_NOT_EDITABLE', error)
    }
    if (hint === 'EMPTY_PATCH') {
      console.error('[product-master] EMPTY_PATCH', error)
    }
    setErrorMsg(humanizeRpcError(error))
  }

  async function saveIdentity(field: string, value: string) {
    if (!canEdit || !editable.has(field)) return
    setSaving(true)
    setErrorMsg(null)
    const patch = { [field]: value || null }
    const result = await callWriteRpc(supabase, 'update_product_fields', {
      p_product_id: product.product_id,
      p_expected_row_version: product.row_version,
      p_patch: patch,
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error, {
        fieldName: field,
        localValue: value,
        pendingPatch: patch,
        retry: async (rv) => {
          const r = await callWriteRpc(supabase, 'update_product_fields', {
            p_product_id: product.product_id,
            p_expected_row_version: rv,
            p_patch: patch,
          })
          if (!r.ok) handleWriteError(r.error)
          else {
            setEditingField(null)
            await refetch()
          }
        },
      })
      return
    }
    setEditingField(null)
    setFlash('Saved')
    await refetch()
  }

  async function saveMsrp(sku: MasterSku, raw: string) {
    if (!canEdit) return
    const price = Number(raw)
    if (!(price > 0)) {
      setErrorMsg('Price must be greater than zero.')
      return
    }
    setSaving(true)
    setErrorMsg(null)
    const result = await callWriteRpc(supabase, 'set_brand_msrp', {
      p_sku_variant_id: sku.sku_variant_id,
      p_price: price,
      p_currency: 'USD',
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    setEditingMsrp(null)
    setFlash('MSRP saved')
    await refetch()
  }

  async function saveIngredients(sku: MasterSku, text: string) {
    if (!canEdit || !sku.ingredients || sku.ingredients.locked) return
    setSaving(true)
    setErrorMsg(null)
    const patch = { ingredients_text_raw: text }
    const result = await callWriteRpc(supabase, 'update_sku_ingredients', {
      p_sku_variant_id: sku.sku_variant_id,
      p_expected_row_version: sku.ingredients.row_version,
      p_patch: patch,
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error, {
        fieldName: 'ingredients_text_raw',
        localValue: text,
        pendingPatch: patch,
        retry: async () => {
          const fresh = await refetch()
          const next = fresh?.skus.find((s) => s.sku_variant_id === sku.sku_variant_id)
          if (!next?.ingredients) return
          const r = await callWriteRpc(supabase, 'update_sku_ingredients', {
            p_sku_variant_id: sku.sku_variant_id,
            p_expected_row_version: next.ingredients.row_version,
            p_patch: patch,
          })
          if (!r.ok) handleWriteError(r.error)
          else {
            setEditingIngredients(null)
            await refetch()
          }
        },
      })
      return
    }
    setEditingIngredients(null)
    setFlash('Ingredients saved')
    await refetch()
  }

  async function saveNutritionField(sku: MasterSku, key: string, raw: string) {
    if (!canEdit || !sku.nutrition || sku.nutrition.locked) return
    setSaving(true)
    setErrorMsg(null)
    const num = raw.trim() === '' ? null : Number(raw)
    const patch = { [key]: num }
    const result = await callWriteRpc(supabase, 'update_sku_nutrition', {
      p_sku_variant_id: sku.sku_variant_id,
      p_expected_row_version: sku.nutrition.row_version,
      p_patch: patch,
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error, {
        fieldName: key,
        localValue: raw,
        pendingPatch: patch,
        retry: async () => {
          const fresh = await refetch()
          const next = fresh?.skus.find((s) => s.sku_variant_id === sku.sku_variant_id)
          if (!next?.nutrition) return
          const r = await callWriteRpc(supabase, 'update_sku_nutrition', {
            p_sku_variant_id: sku.sku_variant_id,
            p_expected_row_version: next.nutrition.row_version,
            p_patch: patch,
          })
          if (!r.ok) handleWriteError(r.error)
          else {
            setEditingNutritionKey(null)
            await refetch()
          }
        },
      })
      return
    }
    setEditingNutritionKey(null)
    setFlash('Nutrition saved')
    await refetch()
  }

  async function uploadImage(file: File, opts?: { makePrimary?: boolean }) {
    if (!canEdit) return
    setUploading(true)
    setErrorMsg(null)
    const brandFolder = product.brand_id ?? effectiveBrandId
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${brandFolder}/${Date.now()}-${safeName}`
    const { error: upErr } = await supabase.storage.from('brand-assets').upload(path, file, {
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })
    if (upErr) {
      setUploading(false)
      setErrorMsg(upErr.message || 'Upload failed.')
      return
    }
    const makePrimary =
      opts?.makePrimary ?? (!product.primary_image_url || master.images.length === 0)
    const result = await callWriteRpc(supabase, 'register_brand_product_image', {
      p_product_id: product.product_id,
      p_image_role: 'front',
      p_storage_path: path,
      p_sku_variant_id: null,
      p_supersede_image_id: null,
      p_make_primary: makePrimary,
    })
    setUploading(false)
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    setFlash(makePrimary ? 'Pack shot added' : 'Image registered')
    await refetch()
  }

  async function promoteImage(imageId: number) {
    if (!canEdit) return
    const result = await callWriteRpc(supabase, 'set_primary_product_image', {
      p_product_image_id: imageId,
    })
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    await refetch()
  }

  async function loadPriceSurface() {
    setPriceLoading(true)
    const result = await callWriteRpc(supabase, 'get_product_price_surface', {
      p_product_id: product.product_id,
    })
    setPriceLoading(false)
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    setPriceSurface(result.data)
  }

  async function searchCompetitors(q: string) {
    setCompetitorQuery(q)
    if (q.trim().length < 2) {
      setCompetitorHits([])
      return
    }
    // Brand users: local stub list (no brand-safe product search RPC yet).
    // dough_admin: search_products_admin when available.
    if (isAdmin) {
      const { data, error } = await supabase.rpc('search_products_admin' as never, {
        p_query: q.trim(),
      } as never)
      if (!error && Array.isArray(data)) {
        setCompetitorHits(
          (data as { product_id: number; product_name_clean?: string }[])
            .slice(0, 8)
            .map((r) => ({
              product_id: r.product_id,
              product_name_display: r.product_name_clean ?? `Product ${r.product_id}`,
            }))
        )
        return
      }
    }
    setCompetitorHits(
      STUB_COMPETITORS.filter((c) =>
        c.product_name_display.toLowerCase().includes(q.toLowerCase())
      )
    )
  }

  function startEditIdentity(field: string, current: string | null) {
    if (!canEdit || !editable.has(field)) return
    setEditingField(field)
    setDraft(current ?? '')
    setErrorMsg(null)
  }

  function priorForField(field: string): RecentChange | undefined {
    return master.recent_changes.find((c) => c.field_name === field)
  }

  return {
    master,
    product,
    editable,
    flash,
    errorMsg,
    stale,
    setStale,
    editingField,
    setEditingField,
    draft,
    setDraft,
    saving,
    showAllNutrients,
    setShowAllNutrients,
    expandedSkus,
    setExpandedSkus,
    priceSurface,
    priceLoading,
    categoryOpen,
    setCategoryOpen,
    competitorQuery,
    competitorHits,
    competitors,
    setCompetitors,
    msrpDraft,
    setMsrpDraft,
    editingMsrp,
    setEditingMsrp,
    editingIngredients,
    setEditingIngredients,
    ingredientsDraft,
    setIngredientsDraft,
    editingNutritionKey,
    setEditingNutritionKey,
    nutritionDraft,
    setNutritionDraft,
    uploading,
    systemFlags,
    proposals,
    correctionTypes,
    pendingFields,
    proposalByField,
    refetch,
    saveIdentity,
    saveMsrp,
    saveIngredients,
    saveNutritionField,
    uploadImage,
    promoteImage,
    loadPriceSurface,
    searchCompetitors,
    startEditIdentity,
    priorForField,
  }
}

export type ProductMasterWrites = ReturnType<typeof useProductMasterWrites>
