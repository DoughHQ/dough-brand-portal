import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { timed } from '@/lib/perf'

/**
 * Distinct, non-deleted battle_rounds that touch a brand product.
 * Session-scoped (impersonation-aware) — do not pass p_brand_id.
 */
export async function fetchBrandTotalBattles(): Promise<number> {
  return timed('fetchBrandTotalBattles', async () => {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('get_brand_total_battles' as never)

    if (error) {
      console.error('[home] get_brand_total_battles', {
        message: error.message,
        code: error.code,
      })
      return 0
    }

    if (data == null) return 0
    // RPC may return a row object or a one-element array depending on PostgREST shape.
    const row = Array.isArray(data) ? data[0] : data
    if (!row || typeof row !== 'object') return 0
    const n = Number((row as { total_battles?: unknown }).total_battles)
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0
  })
}
