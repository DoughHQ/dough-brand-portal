import { createClient } from '@/lib/supabase'
import { parseScopeSearchRows, type ScopeSearchHit } from '@/lib/categoryReport/scopeSearch'

export async function fetchScopes(query: string, signal: AbortSignal): Promise<ScopeSearchHit[]> {
  const q = query.trim()
  const { data, error } = await createClient().rpc(
    'admin_scope_search',
    q.length ? { p_query: q } : {}
  )
  if (signal.aborted) return []
  if (error) throw new Error(error.message)
  return parseScopeSearchRows(data)
}
