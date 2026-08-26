import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { timed } from '@/lib/perf'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import {
  toAdjacentCategoriesResult,
  type AdjacentCategory,
} from '@/lib/adjacentCategories'

const RPC = 'get_brand_adjacent_categories'

/**
 * Session-scoped adjacent L2s (omit brand id — impersonation-aware).
 * Never throws. Returns rows only; logs handled failures with brand context.
 */
export async function fetchBrandAdjacentCategories(opts?: {
  brandId?: number | null
}): Promise<AdjacentCategory[]> {
  return timed('fetchBrandAdjacentCategories', async () => {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc(RPC as never, {} as never)
    const result = toAdjacentCategoriesResult(data, error)
    const brandId = opts?.brandId ?? null

    if (!result.ok) {
      logHandledRpcFailure(RPC, { ...result.error, brandId })
      return result.rows
    }
    if (result.allRowsUnparsed != null) {
      logHandledRpcFailure(RPC, {
        code: 'all_rows_unparsed',
        message: 'adjacent array had rows but none parsed',
        details: null,
        hint: null,
        brandId,
        reason: 'all_rows_unparsed',
        rawCount: result.allRowsUnparsed,
      })
    }
    return result.rows
  })
}
