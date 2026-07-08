import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { getEffectiveBrandScope } from './getEffectiveBrandScope'
import type { EffectiveBrandScope } from './getEffectiveBrandScope'
import type { PortalUser } from '@/lib/queries'

export type PortalBrandScope = EffectiveBrandScope & {
  portalUser: PortalUser
}

/**
 * Server-side helper: resolve portal user + JWT claim scope in one call.
 */
export async function getPortalBrandScope(): Promise<PortalBrandScope | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const portalUser = await getPortalUser()
  if (!portalUser) return null

  const scope = getEffectiveBrandScope(portalUser, session.access_token)
  return { ...scope, portalUser }
}
