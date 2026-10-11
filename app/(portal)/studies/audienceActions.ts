'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  TAXONOMY_NODE_SELECT,
  toTaxonomyNodeInfo,
  type TaxonomyNodeInfo,
  type TaxonomyNodeRow,
} from '@/lib/studies/taxonomy'

export async function getTaxonomyNodeAction(
  nodeId: number,
): Promise<TaxonomyNodeInfo | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select(TAXONOMY_NODE_SELECT)
    .eq('taxonomy_node_id', nodeId)
    .maybeSingle()
  if (error || !data) return null
  return toTaxonomyNodeInfo(data as TaxonomyNodeRow)
}

/** L3 assignable active nodes — shared search-as-you-type for study builders. */
export async function searchTaxonomyNodesAction(
  query: string,
): Promise<TaxonomyNodeInfo[]> {
  const normalized = query.trim()
  if (normalized.length < 2) return []
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select(TAXONOMY_NODE_SELECT)
    .eq('status', 'active')
    .eq('is_assignable', true)
    .eq('node_level', 3)
    .ilike('node_name_display', `%${normalized}%`)
    .order('node_name_display', { ascending: true })
    .limit(20)
  if (error || !data) return []
  return (data as TaxonomyNodeRow[]).map(toTaxonomyNodeInfo)
}
