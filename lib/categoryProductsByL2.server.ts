import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { timed } from '@/lib/perf'
import { SHOW_POPULATION_ELO } from '@/lib/flags'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import {
  toCategoryProductsResult,
  toLockedCategoryProducts,
  type LockedCategoryProduct,
} from '@/lib/categoryProductsByL2'

const RPC = 'get_brand_category_products_by_l2'

export type BrandCategoryProductsFetch =
  | { ok: true; products: LockedCategoryProduct[] }
  | { ok: false; products: [] }

/**
 * Brand products rolled up across all L3 children of an L2.
 * Call with L2 id only — omit brand id so get_effective_brand_id() applies
 * (impersonation-aware). Never throws.
 * ok: false is a handled miss (empty products, already logged).
 * ok: true with [] is a real zero-product category.
 */
export async function fetchBrandCategoryProductsByL2(opts: {
  l2NodeId: number
  brandId?: number | null
}): Promise<BrandCategoryProductsFetch> {
  return timed('fetchBrandCategoryProductsByL2', async () => {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc(RPC as never, {
      p_l2_node_id: opts.l2NodeId,
    } as never)
    const result = toCategoryProductsResult(data, error)
    const brandId = opts.brandId ?? null

    if (!result.ok) {
      logHandledRpcFailure(RPC, { ...result.error, brandId })
      return { ok: false, products: [] }
    }
    if (result.allRowsUnparsed != null) {
      logHandledRpcFailure(RPC, {
        code: 'all_rows_unparsed',
        message: 'category products array had rows but none parsed',
        details: null,
        hint: null,
        brandId,
        reason: 'all_rows_unparsed',
        rawCount: result.allRowsUnparsed,
      })
      return { ok: false, products: [] }
    }
    return {
      ok: true,
      products: toLockedCategoryProducts(result.rows, {
        showPopulationElo: SHOW_POPULATION_ELO,
      }),
    }
  })
}

/** Display name for the L2 header. Existing table read — not a new RPC. */
export async function fetchTaxonomyNodeDisplayName(
  nodeId: number
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select('node_name_display')
    .eq('taxonomy_node_id', nodeId)
    .maybeSingle()
  if (error || !data) return null
  const name = String(data.node_name_display ?? '').trim()
  return name || null
}
