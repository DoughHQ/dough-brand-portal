import 'server-only'

import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { timed } from '@/lib/perf'
import {
  parseBrandHomeSnapshot,
  type BrandHomeSnapshotDoc,
} from './parseBrandHomeSnapshot'

export const getBrandHomeSnapshot = cache(async (): Promise<BrandHomeSnapshotDoc | null> => {
  return timed('brand.home.snapshot', async () => {
    try {
      const supabase = await createServerSupabaseClient()
      // Ensure cold-stats row exists for impersonation / non-portal brands.
      await supabase.rpc('ensure_effective_brand_home_catalog_row' as never)
      const { data, error } = await supabase.rpc('get_brand_home_snapshot' as never)
      if (error) {
        logHandledRpcFailure('get_brand_home_snapshot', {
          code: error.code ?? null,
          message: error.message,
          details: error.details ?? null,
          hint: error.hint ?? null,
          reason: 'brand_home',
        })
        return null
      }
      return parseBrandHomeSnapshot(data)
    } catch (err) {
      logHandledRpcFailure('get_brand_home_snapshot', {
        code: null,
        message: err instanceof Error ? err.message : String(err),
        details: null,
        hint: null,
        reason: 'brand_home',
      })
      return null
    }
  })
})
