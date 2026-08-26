import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseOperatorStudyRows } from './parseOperatorStudies'
import type { OperatorStudyRow } from './types'

/**
 * Operator studies for the current portal caller (published + optional drafts/finished).
 * Tenancy is enforced inside list_operator_studies — do not filter by brand here.
 * Pass p_brand_id only for admin "view as" narrowing.
 */
export async function getOperatorStudies(options?: {
  includeFinished?: boolean
  includeDrafts?: boolean
  brandId?: number | null
}): Promise<OperatorStudyRow[]> {
  const supabase = await createServerSupabaseClient()

  // Generated Args type p_brand_id as required number; the live RPC still
  // treats NULL as "all brands" for dough_admin. Preserve that runtime.
  const { data, error } = await supabase.rpc('list_operator_studies', {
    p_include_finished: options?.includeFinished ?? true,
    p_include_drafts: options?.includeDrafts ?? false,
    p_brand_id: (options?.brandId ?? null) as number,
  })

  if (error) throw new Error(error.message)

  return parseOperatorStudyRows(data)
}
