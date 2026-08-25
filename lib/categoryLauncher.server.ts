import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  parseBrandCategoryLauncher,
  type BrandCategoryLauncher,
} from '@/lib/categoryLauncher'
import { timed } from '@/lib/perf'

/**
 * Session-scoped category launcher (omit p_brand_id — impersonation-aware).
 * Returns ~tens of category rows, not raw products.
 */
export async function fetchBrandCategoryLauncherServer(
  search?: string | null
): Promise<BrandCategoryLauncher> {
  return timed('fetchBrandCategoryLauncher', async () => {
    const supabase = await createServerSupabaseClient()
    const trimmed = search?.trim() || ''
    const args = trimmed ? { p_search: trimmed } : {}
    const { data, error } = await supabase.rpc(
      'get_brand_category_launcher' as never,
      args as never
    )
    if (error) {
      console.error('[home] get_brand_category_launcher', {
        message: error.message,
        code: error.code,
      })
      return parseBrandCategoryLauncher(null)
    }
    return parseBrandCategoryLauncher(data)
  })
}
