import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { OperatorStudyRow } from './types'

/**
 * Published (non-draft) studies for the current portal caller.
 * Tenancy is enforced inside list_operator_studies — do not filter by brand here.
 * Pass p_brand_id only for admin "view as" narrowing.
 */
export async function getOperatorStudies(options?: {
  includeFinished?: boolean
  brandId?: number | null
}): Promise<OperatorStudyRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_operator_studies', {
    p_include_finished: options?.includeFinished ?? true,
    p_brand_id: options?.brandId ?? null,
  })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Partial<OperatorStudyRow> & OperatorStudyRow>
  // target_completions is optional until the RPC always returns it — never invent N.
  return rows.map((row) => ({
    ...row,
    target_completions:
      typeof row.target_completions === 'number' &&
      Number.isFinite(row.target_completions) &&
      row.target_completions > 0
        ? row.target_completions
        : null,
  }))
}
