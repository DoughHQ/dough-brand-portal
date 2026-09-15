'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  fetchOperatorBoxesPage,
  type BoxTab,
  type OperatorBoxRow,
  type OperatorBoxesPageCursor,
} from '@/lib/box/operator'

export async function listOperatorBoxesAction(opts: {
  tab: BoxTab
  includeArchived?: boolean
  cursor?: OperatorBoxesPageCursor | null
}): Promise<
  | {
      ok: true
      rows: OperatorBoxRow[]
      hasMore: boolean
      nextCursor: OperatorBoxesPageCursor | null
    }
  | { ok: false; error: string }
> {
  const scope = await getPortalBrandScope()
  if (!scope || scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    return { ok: false, error: 'Not authorized.' }
  }
  const supabase = await createServerSupabaseClient()
  const result = await fetchOperatorBoxesPage(supabase, {
    tab: opts.tab,
    includeArchived: opts.includeArchived,
    limit: 25,
    cursor: opts.cursor ?? null,
  })
  if (!result.ok) return result
  return {
    ok: true,
    rows: result.page.rows,
    hasMore: result.page.hasMore,
    nextCursor: result.page.nextCursor,
  }
}
