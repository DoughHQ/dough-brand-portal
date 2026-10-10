'use server'

import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import {
  fetchOperatorStudiesPage,
  type StudiesPageCursor,
  type StudiesPageTab,
} from '@/lib/studies/fetchOperatorStudies'
import { attachOrderStatus } from '@/lib/checkout/load'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { operatorStudiesBrandId } from '@/lib/studies/operatorScope'
import type { OperatorStudyRow } from '@/lib/studies/types'

export async function listOperatorStudiesPageAction(opts: {
  tab: StudiesPageTab
  cursor?: StudiesPageCursor | null
}): Promise<
  | {
      ok: true
      rows: OperatorStudyRow[]
      hasMore: boolean
      nextCursor: StudiesPageCursor | null
    }
  | { ok: false; error: string }
> {
  const scope = await getPortalBrandScope()
  if (!scope) return { ok: false, error: 'Not signed in.' }

  const brandId = operatorStudiesBrandId(scope)

  const result = await fetchOperatorStudiesPage({
    tab: opts.tab,
    limit: 25,
    cursor: opts.cursor ?? null,
    brandId,
    includeDrafts: false,
  })
  if (!result.ok) return result
  const supabase = await createServerSupabaseClient()
  const rows = await attachOrderStatus(supabase, result.page.rows)
  return {
    ok: true,
    rows,
    hasMore: result.page.hasMore,
    nextCursor: result.page.nextCursor,
  }
}
