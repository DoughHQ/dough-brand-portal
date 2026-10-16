import type { SupabaseClient } from '@supabase/supabase-js'
import { moderateBrandPhotoAction } from '@/app/(portal)/products/photoActions'
import type { Database } from '@/lib/database.types'
import { uploadBrandProductPhoto } from '@/lib/productMaster/brandPhoto'
import { callWriteRpc } from '@/lib/productMaster/fetch'
import type { RpcErrorLike } from '@/lib/productMaster/errors'
import type { MasterSku, ProductMaster } from '@/lib/productMaster/types'
import type { CompetitorHit } from './useProductMasterWrites'

const STUB_COMPETITORS: CompetitorHit[] = [
  { product_id: 1, product_name_display: 'Nature Valley Sweet & Salty' },
  { product_id: 2, product_name_display: 'KIND Dark Chocolate Nuts' },
  { product_id: 3, product_name_display: 'Clif Bar Chocolate Chip' },
  { product_id: 4, product_name_display: 'RXBAR Peanut Butter' },
  { product_id: 5, product_name_display: 'Larabar Apple Pie' },
]

type WriteErrorCtx = {
  fieldName?: string
  localValue?: unknown
  pendingPatch?: Record<string, unknown>
  retry?: (rv: number) => Promise<void>
}

export type ProductMasterMutationCtx = {
  supabase: SupabaseClient<Database>
  canEdit: boolean
  isAdmin: boolean
  product: ProductMaster['product']
  effectiveBrandId: number
  master: ProductMaster
  refetch: () => Promise<ProductMaster | null>
  handleWriteError: (error: RpcErrorLike, ctx?: WriteErrorCtx) => void
  setSaving: (value: boolean) => void
  setErrorMsg: (value: string | null) => void
  setFlash: (value: string | null) => void
  setUploading: (value: boolean) => void
  setPriceLoading: (value: boolean) => void
  setPriceSurface: (value: unknown) => void
  setCompetitorQuery: (value: string) => void
  setCompetitorHits: (value: CompetitorHit[]) => void
  setEditingMsrp: (value: number | null) => void
  setEditingIngredients: (value: number | null) => void
  setEditingNutritionKey: (value: string | null) => void
}

export async function saveMsrp(ctx: ProductMasterMutationCtx, sku: MasterSku, raw: string) {
  if (!ctx.canEdit) return
  const price = Number(raw)
  if (!(price > 0)) {
    ctx.setErrorMsg('Price must be greater than zero.')
    return
  }
  ctx.setSaving(true)
  ctx.setErrorMsg(null)
  const result = await callWriteRpc(ctx.supabase, 'set_brand_msrp', {
    p_sku_variant_id: sku.sku_variant_id,
    p_price: price,
    p_currency: 'USD',
  })
  ctx.setSaving(false)
  if (!result.ok) {
    ctx.handleWriteError(result.error)
    return
  }
  ctx.setEditingMsrp(null)
  ctx.setFlash('MSRP saved')
  await ctx.refetch()
}

export async function saveIngredients(ctx: ProductMasterMutationCtx, sku: MasterSku, text: string) {
  if (!ctx.canEdit || !sku.ingredients || sku.ingredients.locked) return
  ctx.setSaving(true)
  ctx.setErrorMsg(null)
  const patch = { ingredients_text_raw: text }
  const result = await callWriteRpc(ctx.supabase, 'update_sku_ingredients', {
    p_sku_variant_id: sku.sku_variant_id,
    p_expected_row_version: sku.ingredients.row_version,
    p_patch: patch,
  })
  ctx.setSaving(false)
  if (!result.ok) {
    ctx.handleWriteError(result.error, {
      fieldName: 'ingredients_text_raw',
      localValue: text,
      pendingPatch: patch,
      retry: async () => {
        const fresh = await ctx.refetch()
        const next = fresh?.skus.find((s) => s.sku_variant_id === sku.sku_variant_id)
        if (!next?.ingredients) return
        const r = await callWriteRpc(ctx.supabase, 'update_sku_ingredients', {
          p_sku_variant_id: sku.sku_variant_id,
          p_expected_row_version: next.ingredients.row_version,
          p_patch: patch,
        })
        if (!r.ok) ctx.handleWriteError(r.error)
        else {
          ctx.setEditingIngredients(null)
          await ctx.refetch()
        }
      },
    })
    return
  }
  ctx.setEditingIngredients(null)
  ctx.setFlash('Ingredients saved')
  await ctx.refetch()
}

export async function saveNutritionField(
  ctx: ProductMasterMutationCtx,
  sku: MasterSku,
  key: string,
  raw: string,
) {
  if (!ctx.canEdit || !sku.nutrition || sku.nutrition.locked) return
  ctx.setSaving(true)
  ctx.setErrorMsg(null)
  const num = raw.trim() === '' ? null : Number(raw)
  const patch = { [key]: num }
  const result = await callWriteRpc(ctx.supabase, 'update_sku_nutrition', {
    p_sku_variant_id: sku.sku_variant_id,
    p_expected_row_version: sku.nutrition.row_version,
    p_patch: patch,
  })
  ctx.setSaving(false)
  if (!result.ok) {
    ctx.handleWriteError(result.error, {
      fieldName: key,
      localValue: raw,
      pendingPatch: patch,
      retry: async () => {
        const fresh = await ctx.refetch()
        const next = fresh?.skus.find((s) => s.sku_variant_id === sku.sku_variant_id)
        if (!next?.nutrition) return
        const r = await callWriteRpc(ctx.supabase, 'update_sku_nutrition', {
          p_sku_variant_id: sku.sku_variant_id,
          p_expected_row_version: next.nutrition.row_version,
          p_patch: patch,
        })
        if (!r.ok) ctx.handleWriteError(r.error)
        else {
          ctx.setEditingNutritionKey(null)
          await ctx.refetch()
        }
      },
    })
    return
  }
  ctx.setEditingNutritionKey(null)
  ctx.setFlash('Nutrition saved')
  await ctx.refetch()
}

export async function uploadImage(
  ctx: ProductMasterMutationCtx,
  file: File,
  opts?: { makePrimary?: boolean },
) {
  if (!ctx.canEdit) return
  ctx.setUploading(true)
  ctx.setErrorMsg(null)
  try {
    const uploaded = await uploadBrandProductPhoto({
      supabase: ctx.supabase,
      brandId: ctx.product.brand_id ?? ctx.effectiveBrandId,
      file,
      moderate: moderateBrandPhotoAction,
    })
    if (!uploaded.ok) {
      ctx.setErrorMsg(uploaded.message)
      return
    }
    const makePrimary =
      opts?.makePrimary ?? (!ctx.product.primary_image_url || ctx.master.images.length === 0)
    const result = await callWriteRpc(ctx.supabase, 'register_brand_product_image', {
      p_product_id: ctx.product.product_id,
      p_image_role: 'front',
      p_storage_path: uploaded.storagePath,
      p_sku_variant_id: null,
      p_supersede_image_id: null,
      p_make_primary: makePrimary,
    })
    if (!result.ok) {
      ctx.handleWriteError(result.error)
      return
    }
    ctx.setFlash(makePrimary ? 'Pack shot added' : 'Image registered')
    await ctx.refetch()
  } finally {
    ctx.setUploading(false)
  }
}

export async function promoteImage(ctx: ProductMasterMutationCtx, imageId: number) {
  if (!ctx.canEdit) return
  const result = await callWriteRpc(ctx.supabase, 'set_primary_product_image', {
    p_product_image_id: imageId,
  })
  if (!result.ok) {
    ctx.handleWriteError(result.error)
    return
  }
  await ctx.refetch()
}

export async function loadPriceSurface(ctx: ProductMasterMutationCtx) {
  ctx.setPriceLoading(true)
  const result = await callWriteRpc(ctx.supabase, 'get_product_price_surface', {
    p_product_id: ctx.product.product_id,
  })
  ctx.setPriceLoading(false)
  if (!result.ok) {
    ctx.handleWriteError(result.error)
    return
  }
  ctx.setPriceSurface(result.data)
}

export async function searchCompetitors(ctx: ProductMasterMutationCtx, q: string) {
  ctx.setCompetitorQuery(q)
  if (q.trim().length < 2) {
    ctx.setCompetitorHits([])
    return
  }
  // Brand users: local stub list (no brand-safe product search RPC yet).
  // dough_admin: search_products_admin when available.
  if (ctx.isAdmin) {
    const { data, error } = await ctx.supabase.rpc('search_products_admin' as never, {
      p_query: q.trim(),
    } as never)
    if (!error && Array.isArray(data)) {
      ctx.setCompetitorHits(
        (data as { product_id: number; product_name_clean?: string }[])
          .slice(0, 8)
          .map((r) => ({
            product_id: r.product_id,
            product_name_display: r.product_name_clean ?? `Product ${r.product_id}`,
          })),
      )
      return
    }
  }
  ctx.setCompetitorHits(
    STUB_COMPETITORS.filter((c) =>
      c.product_name_display.toLowerCase().includes(q.toLowerCase()),
    ),
  )
}
