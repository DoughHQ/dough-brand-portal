'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchOperatorBoxes, type OperatorBoxRow } from '@/lib/box/operator'

/** List loader. The RPC is admin-gated in Postgres; this re-checks the
 *  strict operator gate (dough_admin and not impersonating) so an
 *  impersonating admin cannot call it as a confused deputy. */
export async function listOperatorBoxesAction(opts?: {
  includeArchived?: boolean
}): Promise<{ ok: true; rows: OperatorBoxRow[] } | { ok: false; error: string }> {
  const scope = await getPortalBrandScope()
  if (!scope || scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    return { ok: false, error: 'Not authorized.' }
  }
  const supabase = await createServerSupabaseClient()
  return fetchOperatorBoxes(supabase, opts)
}
