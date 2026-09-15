import 'server-only'

import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { parseBrandPortalChrome, type BrandPortalChrome } from './parseBrandHomeSnapshot'

/**
 * Layout-only chrome. Never call get_brand_home_snapshot from layout.
 */
export const getBrandPortalChrome = cache(async (): Promise<BrandPortalChrome | null> => {
  try {
    const supabase = await createServerSupabaseClient()
    // Layout-only: never ensure/dirty here — that RPC belongs on Home snapshot.
    const { data, error } = await supabase.rpc('get_brand_portal_chrome' as never)
    if (error) {
      logHandledRpcFailure('get_brand_portal_chrome', {
        code: error.code ?? null,
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
        reason: 'brand_chrome',
      })
      return null
    }
    return parseBrandPortalChrome(data)
  } catch (err) {
    logHandledRpcFailure('get_brand_portal_chrome', {
      code: null,
      message: err instanceof Error ? err.message : String(err),
      details: null,
      hint: null,
      reason: 'brand_chrome',
    })
    return null
  }
})
