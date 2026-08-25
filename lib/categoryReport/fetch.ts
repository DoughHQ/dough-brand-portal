import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseCategoryReport } from './parse'
import type { CategoryMode, CategoryReportLoadResult, CategoryScope } from './types'

function isAdminOnly(error: { message?: string; hint?: string; code?: string }): boolean {
  const blob = `${error.message ?? ''} ${error.hint ?? ''} ${error.code ?? ''}`.toLowerCase()
  return blob.includes('admin-only') || blob.includes('admin only')
}

export async function fetchCategoryReport(args: {
  scope: CategoryScope
  scopeId: number
  focalProductId: number | null
  mode: CategoryMode
}): Promise<CategoryReportLoadResult> {
  const supabase = await createServerSupabaseClient()
  const rpcArgs: {
    p_scope: string
    p_scope_id: number
    p_mode: string
    p_focal_product_id?: number
  } = {
    p_scope: args.scope,
    p_scope_id: args.scopeId,
    p_mode: args.mode,
  }
  if (args.focalProductId != null) {
    rpcArgs.p_focal_product_id = args.focalProductId
  }

  const { data, error } = await supabase.rpc('compute_category_report', rpcArgs)

  if (error) {
    if (isAdminOnly(error)) {
      return { ok: false, code: 'ADMIN_ONLY', detail: error.message }
    }
    return { ok: false, code: 'FETCH_ERROR', detail: error.message }
  }

  const report = parseCategoryReport(data)
  if (!report) {
    return { ok: false, code: 'MALFORMED', detail: 'Report payload is incomplete or malformed.' }
  }
  return { ok: true, report }
}
