import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { timed } from '@/lib/perf'
import {
  selectCatalogHealth,
  type CatalogHealth,
  type CatalogHealthProduct,
} from '@/lib/brandHome/catalogHealth'
import type { ProductImageCandidate } from '@/lib/brandHome/productSignalCards'

const EMPTY: CatalogHealth = {
  total: 0,
  categories: { have: 0, total: 0 },
  images: { have: 0, total: 0 },
  pricing: { have: 0, total: 0 },
  labelAllergen: { have: 0, total: 0 },
}

const IN_CHUNK = 200

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * Catalog Health for Home. Filter matches getBrandProductCount:
 * brand_id + status = active + is_suppressed = false.
 * Image presence uses the same pack-shot rule as Your products cards.
 */
export async function fetchCatalogHealth(brandId: number): Promise<CatalogHealth> {
  return timed('fetchCatalogHealth', async () => {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .select('product_id, taxonomy_node_id, image_url, canonical_price_per_oz')
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .eq('is_suppressed', false)

    if (error) {
      logHandledRpcFailure('products.catalog_health', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        brandId,
      })
      return EMPTY
    }

    const products: CatalogHealthProduct[] = (data ?? []).map((row) => ({
      productId: Number(row.product_id),
      taxonomyNodeId: row.taxonomy_node_id == null ? null : Number(row.taxonomy_node_id),
      imageUrl: row.image_url == null ? null : String(row.image_url),
      canonicalPricePerOz:
        row.canonical_price_per_oz == null ? null : Number(row.canonical_price_per_oz),
    })).filter((p) => Number.isFinite(p.productId))

    const ids = products.map((p) => p.productId)
    const imagesByProduct = new Map<number, ProductImageCandidate[]>()
    const confidentAllergenProductIds = new Set<number>()

    if (ids.length === 0) return selectCatalogHealth([], imagesByProduct, confidentAllergenProductIds)

    for (const idChunk of chunk(ids, IN_CHUNK)) {
      const { data: imageRows, error: imageError } = await supabase
        .from('product_images')
        .select('product_id, public_url, is_primary, image_role')
        .in('product_id', idChunk)
        .is('deleted_at', null)

      if (imageError) {
        logHandledRpcFailure('product_images.catalog_health', {
          code: imageError.code,
          message: imageError.message,
          details: imageError.details,
          hint: imageError.hint,
          brandId,
        })
      } else {
        for (const row of imageRows ?? []) {
          const productId = Number(row.product_id)
          if (!Number.isFinite(productId)) continue
          const list = imagesByProduct.get(productId) ?? []
          list.push({
            product_id: productId,
            public_url: row.public_url == null ? null : String(row.public_url),
            is_primary: Boolean(row.is_primary),
            image_role: row.image_role == null ? null : String(row.image_role),
          })
          imagesByProduct.set(productId, list)
        }
      }

      const { data: allergenRows, error: allergenError } = await supabase
        .from('product_allergen_status')
        .select('product_id, status')
        .in('product_id', idChunk)
        .eq('status', 'confident')

      if (allergenError) {
        logHandledRpcFailure('product_allergen_status.catalog_health', {
          code: allergenError.code,
          message: allergenError.message,
          details: allergenError.details,
          hint: allergenError.hint,
          brandId,
        })
      } else {
        for (const row of allergenRows ?? []) {
          const productId = Number(row.product_id)
          if (Number.isFinite(productId)) confidentAllergenProductIds.add(productId)
        }
      }
    }

    return selectCatalogHealth(products, imagesByProduct, confidentAllergenProductIds)
  })
}
