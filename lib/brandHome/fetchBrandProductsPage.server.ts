import 'server-only'

import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { timed } from '@/lib/perf'
import {
  parseBrandProductPage,
  type BrandCatalogSummary,
  type BrandProductPage,
  type BrandProductPageCursor,
} from '@/lib/brandHome/parseBrandProductPage'

export type {
  BrandCatalogSummary,
  BrandProductPage,
  BrandProductPageCursor,
  BrandProductPageItem,
} from '@/lib/brandHome/parseBrandProductPage'

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function asNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export const getBrandCatalogSummary = cache(async (): Promise<BrandCatalogSummary | null> => {
  return timed('brand.catalog.summary', async () => {
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.rpc('get_brand_catalog_summary' as never)
      if (error) {
        logHandledRpcFailure('get_brand_catalog_summary', {
          code: error.code ?? null,
          message: error.message,
          details: error.details ?? null,
          hint: error.hint ?? null,
          reason: 'brand_catalog_summary',
        })
        return null
      }
      const r = asRecord(data)
      if (!r) return null
      const brandId = asNum(r.brand_id)
      if (!Number.isFinite(brandId) || brandId <= 0) return null
      return {
        brandId,
        productCount: asNum(r.product_count),
        battledCount: asNum(r.battled_count),
        categoryCount: asNum(r.category_count),
        claimedSkuCount: asNum(r.claimed_sku_count),
        catalogRefreshedAt: r.catalog_refreshed_at == null ? null : String(r.catalog_refreshed_at),
      }
    } catch (err) {
      logHandledRpcFailure('get_brand_catalog_summary', {
        code: null,
        message: err instanceof Error ? err.message : String(err),
        details: null,
        hint: null,
        reason: 'brand_catalog_summary',
      })
      return null
    }
  })
})

export async function listBrandProductsPage(opts?: {
  limit?: number
  cursor?: BrandProductPageCursor | null
  battledOnly?: boolean
  search?: string | null
}): Promise<BrandProductPage | null> {
  return timed('brand.products.page', async () => {
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.rpc('list_brand_products_page' as never, {
        p_limit: opts?.limit ?? 50,
        p_cursor_battles: opts?.cursor?.totalBattles ?? null,
        p_cursor_product_id: opts?.cursor?.productId ?? null,
        p_battled_only: opts?.battledOnly ?? false,
        p_search: opts?.search?.trim() || null,
      } as never)
      if (error) {
        logHandledRpcFailure('list_brand_products_page', {
          code: error.code ?? null,
          message: error.message,
          details: error.details ?? null,
          hint: error.hint ?? null,
          reason: 'brand_products_page',
        })
        return null
      }
      return parseBrandProductPage(data)
    } catch (err) {
      logHandledRpcFailure('list_brand_products_page', {
        code: null,
        message: err instanceof Error ? err.message : String(err),
        details: null,
        hint: null,
        reason: 'brand_products_page',
      })
      return null
    }
  })
}
