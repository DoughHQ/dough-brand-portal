import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { WithdrawnStudyRow } from './types'

/**
 * Withdrawn (trashed) studies for the current portal caller.
 * Tenancy is enforced inside list_withdrawn_studies — do not filter by brand here.
 */
export async function getWithdrawnStudies(options?: {
  brandId?: number | null
}): Promise<WithdrawnStudyRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_withdrawn_studies', {
    p_brand_id: options?.brandId ?? null,
  })

  if (error) throw new Error(error.message)

  return (data ?? []) as WithdrawnStudyRow[]
}
