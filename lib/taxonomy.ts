import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export type TaxonomySearchHit = {
  taxonomy_node_id: number
  node_name_display: string | null
  path_names_csv: string | null
  node_level: number | null
  is_leaf: boolean | null
}

export type TaxonomyL2Parent = {
  l2_id: number
  l2_node_name: string
  l3_count: number
}

export type TaxonomyL3Child = {
  taxonomy_node_id: number
  node_name_display: string | null
  path_names_csv: string | null
  l2_node_name: string | null
}

export type TaxonomyL2Label = {
  taxonomy_node_id: number
  l2_node_name: string | null
}

export async function searchTaxonomyNodes(
  query: string,
  limit = 25
): Promise<TaxonomySearchHit[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('search_taxonomy_nodes' as never, {
    p_query: query,
    p_limit: limit,
  } as never)
  if (error) {
    console.error('[taxonomy] search_taxonomy_nodes', error)
    return []
  }
  return (data ?? []) as TaxonomySearchHit[]
}

export async function listTaxonomyL2Parents(): Promise<TaxonomyL2Parent[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_taxonomy_l2_parents' as never)
  if (error) {
    console.error('[taxonomy] list_taxonomy_l2_parents', error)
    throw new Error(error.message)
  }
  return (data ?? []) as TaxonomyL2Parent[]
}

export async function listTaxonomyL3Children(l2Id: number): Promise<TaxonomyL3Child[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_taxonomy_l3_children' as never, {
    p_l2_id: l2Id,
  } as never)
  if (error) {
    console.error('[taxonomy] list_taxonomy_l3_children', error)
    throw new Error(error.message)
  }
  return (data ?? []) as TaxonomyL3Child[]
}

export async function resolveTaxonomyL2Labels(
  nodeIds: number[]
): Promise<TaxonomyL2Label[]> {
  if (nodeIds.length === 0) return []
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('resolve_taxonomy_l2_labels' as never, {
    p_node_ids: nodeIds,
  } as never)
  if (error) {
    console.error('[taxonomy] resolve_taxonomy_l2_labels', error)
    throw new Error(error.message)
  }
  return (data ?? []) as TaxonomyL2Label[]
}
