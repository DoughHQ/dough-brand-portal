import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { timed } from '@/lib/perf'

/**
 * True when this brand has a verified domain-claim row.
 * Uses effective brand id from the caller (impersonation-aware).
 *
 * RLS on brand_portal_verification is admin-only SELECT today, so a brand
 * session typically sees count 0. That matches current reality (no brand is
 * domain-verified). Do not read has_portal_access.
 */
export async function fetchDomainVerified(brandId: number): Promise<boolean> {
  return timed('fetchDomainVerified', async () => {
    const supabase = await createServerSupabaseClient()
    const { count, error } = await supabase
      .from('brand_portal_verification')
      .select('verification_id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'verified')

    if (error) {
      logHandledRpcFailure('brand_portal_verification', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        brandId,
        reason: 'domainVerified_read',
      })
      return false
    }

    return (count ?? 0) > 0
  })
}
