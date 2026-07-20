import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type {
  CompareGroupDetail,
  CompareGroupListResult,
  CompareGroupMetrics,
  CompareGroupScope,
  CreateCompareGroupInput,
  SimilarityResult,
  UpdateCompareGroupPatch,
} from '@/lib/compareGroups.shared'

function rpcError(error: { message?: string; code?: string }): Error & { code?: string } {
  const err = new Error(error.message ?? 'RPC failed') as Error & { code?: string }
  if (error.code) err.code = error.code
  return err
}

export async function listCompareGroups(
  scope: CompareGroupScope = 'curated_active'
): Promise<CompareGroupListResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_compare_groups' as never, {
    p_scope: scope,
  } as never)
  if (error) throw rpcError(error)
  const raw = (data ?? {}) as CompareGroupListResult
  return {
    scope: raw.scope ?? scope,
    count: raw.count ?? 0,
    groups: (raw.groups ?? []).map((g) => ({
      ...g,
      peak_hours: Array.isArray(g.peak_hours)
        ? g.peak_hours.map(Number).filter((n) => Number.isFinite(n))
        : null,
      has_time_priors: Boolean(g.has_time_priors ?? g.peak_bucket),
    })),
  }
}

export async function getCompareGroupDetail(id: number): Promise<CompareGroupDetail> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_compare_group_detail' as never, {
    p_compare_group_id: id,
  } as never)
  if (error) throw rpcError(error)
  if (!data || typeof data !== 'object') {
    const err = new Error('Compare group not found') as Error & { code?: string }
    err.code = 'P0002'
    throw err
  }
  const raw = data as CompareGroupDetail
  return {
    group: raw.group,
    nodes: raw.nodes ?? [],
    recent_revisions: raw.recent_revisions ?? [],
  }
}

export async function getCompareGroupMetrics(id: number): Promise<CompareGroupMetrics> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_compare_group_metrics' as never, {
    p_compare_group_id: id,
  } as never)
  if (error) throw rpcError(error)
  return data as CompareGroupMetrics
}

export async function checkCompareGroupSimilarity(
  nodeIds: number[],
  question: string | null,
  excludeId: number | null
): Promise<SimilarityResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('check_compare_group_similarity' as never, {
    p_node_ids: nodeIds,
    p_question: question,
    p_exclude_id: excludeId,
  } as never)
  if (error) throw rpcError(error)
  const raw = (data ?? {}) as SimilarityResult
  return {
    candidate_node_count: raw.candidate_node_count ?? nodeIds.length,
    node_warnings: raw.node_warnings ?? [],
    question_warnings: raw.question_warnings ?? [],
    has_warnings: Boolean(raw.has_warnings),
  }
}

export async function createCompareGroup(
  input: CreateCompareGroupInput
): Promise<CompareGroupDetail> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('create_compare_group' as never, {
    p_name: input.name,
    p_consumer_question: input.question ?? null,
    p_node_ids: input.nodeIds,
    p_description: input.description ?? null,
    p_compare_group_type: input.type ?? 'primary',
    p_battle_level: input.battleLevel ?? 1,
    p_note: input.note ?? null,
  } as never)
  if (error) throw rpcError(error)
  return data as CompareGroupDetail
}

export async function updateCompareGroupFields(
  id: number,
  patch: UpdateCompareGroupPatch
): Promise<CompareGroupDetail> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('update_compare_group_fields' as never, {
    p_compare_group_id: id,
    p_name: patch.name === undefined ? null : patch.name,
    p_consumer_question: patch.question === undefined ? null : patch.question,
    p_description: patch.description === undefined ? null : patch.description,
    p_compare_group_type: patch.type === undefined ? null : patch.type,
    p_battle_level: patch.battleLevel === undefined ? null : patch.battleLevel,
    p_status: patch.status === undefined ? null : patch.status,
    p_note: patch.note === undefined ? null : patch.note,
  } as never)
  if (error) throw rpcError(error)
  return data as CompareGroupDetail
}

export async function setCompareGroupMembers(
  id: number,
  nodeIds: number[],
  note?: string | null
): Promise<CompareGroupDetail> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('set_compare_group_members' as never, {
    p_compare_group_id: id,
    p_node_ids: nodeIds,
    p_note: note ?? null,
  } as never)
  if (error) throw rpcError(error)
  return data as CompareGroupDetail
}
