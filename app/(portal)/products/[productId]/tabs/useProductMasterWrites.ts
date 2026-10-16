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
import {
  loadPriceSurface as loadPriceSurfaceMutation,
  promoteImage as promoteImageMutation,
  saveIngredients as saveIngredientsMutation,
  saveMsrp as saveMsrpMutation,
  saveNutritionField as saveNutritionFieldMutation,
  searchCompetitors as searchCompetitorsMutation,
  uploadImage as uploadImageMutation,
} from './productMasterMutations'

export type StaleState = {
  fieldName: string
  localValue: unknown
  change: RecentChange | null
  pendingPatch: Record<string, unknown>
  retry: (newRowVersion: number) => Promise<void>
}

export type CompetitorHit = { product_id: number; product_name_display: string }

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

  const mutations = {
    supabase,
    canEdit,
    isAdmin,
    product,
    effectiveBrandId,
    master,
    refetch,
    handleWriteError,
    setSaving,
    setErrorMsg,
    setFlash,
    setUploading,
    setPriceLoading,
    setPriceSurface,
    setCompetitorQuery,
    setCompetitorHits,
    setEditingMsrp,
    setEditingIngredients,
    setEditingNutritionKey,
  }

  const saveMsrp = (sku: MasterSku, raw: string) => saveMsrpMutation(mutations, sku, raw)
  const saveIngredients = (sku: MasterSku, text: string) =>
    saveIngredientsMutation(mutations, sku, text)
  const saveNutritionField = (sku: MasterSku, key: string, raw: string) =>
    saveNutritionFieldMutation(mutations, sku, key, raw)
  const uploadImage = (file: File, opts?: { makePrimary?: boolean }) =>
    uploadImageMutation(mutations, file, opts)
  const promoteImage = (imageId: number) => promoteImageMutation(mutations, imageId)
  const loadPriceSurface = () => loadPriceSurfaceMutation(mutations)
  const searchCompetitors = (q: string) => searchCompetitorsMutation(mutations, q)

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
