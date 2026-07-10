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

  return (data ?? []) as OperatorStudyRow[]
}
