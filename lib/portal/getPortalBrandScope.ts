import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { getEffectiveBrandScope } from './getEffectiveBrandScope'
import type { EffectiveBrandScope } from './getEffectiveBrandScope'
import type { PortalUser } from '@/lib/queries'
import { perfLog, perfNow } from '@/lib/perf'

export type PortalBrandScope = EffectiveBrandScope & {
  portalUser: PortalUser
}

/**
 * Server-side helper: resolve portal user + JWT claim scope in one call.
 * React.cache dedupes layout + page within the same request.
 */
export const getPortalBrandScope = cache(async (): Promise<PortalBrandScope | null> => {
  const t0 = perfNow()
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const portalUser = await getPortalUser()
  if (!portalUser) return null

  const scope = getEffectiveBrandScope(portalUser, session.access_token)
  perfLog('getPortalBrandScope', perfNow() - t0, {
    role: portalUser.role,
    impersonating: scope.isImpersonating,
  })
  return { ...scope, portalUser }
})
