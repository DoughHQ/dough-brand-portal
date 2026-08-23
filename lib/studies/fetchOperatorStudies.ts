import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { OperatorStudyLifecycleState, OperatorStudyRow } from './types'

const LIFECYCLE_STATES = new Set<OperatorStudyLifecycleState>([
  'active',
  'completed',
  'expired',
  'archived',
  'paused',
  'scheduled',
  'draft',
])

function normalizeLifecycle(
  raw: unknown,
  fallbackStatus: string | undefined
): OperatorStudyLifecycleState {
  if (typeof raw === 'string' && LIFECYCLE_STATES.has(raw as OperatorStudyLifecycleState)) {
    return raw as OperatorStudyLifecycleState
  }
  // Compatibility until every environment returns lifecycle_state.
  if (fallbackStatus === 'draft') return 'draft'
  if (fallbackStatus === 'completed') return 'completed'
  if (fallbackStatus === 'expired') return 'expired'
  if (fallbackStatus === 'archived') return 'archived'
  if (fallbackStatus === 'paused') return 'paused'
  return 'active'
}

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

  const rows = (data ?? []) as Array<Record<string, unknown>>
  // target_completions is optional — never invent N from total_claims.
  return rows.map((row) => {
    const status = typeof row.status === 'string' ? row.status : 'active'
    const targetRaw = row.target_completions
    const target =
      typeof targetRaw === 'number' &&
      Number.isFinite(targetRaw) &&
      targetRaw > 0
        ? targetRaw
        : null
    const maxClaimsRaw = row.max_claims
    const maxClaims =
      typeof maxClaimsRaw === 'number' &&
      Number.isFinite(maxClaimsRaw) &&
      maxClaimsRaw > 0
        ? maxClaimsRaw
        : null

    const testTypeRaw = row.test_type
    const test_type: OperatorStudyRow['test_type'] =
      testTypeRaw === 'concept' || testTypeRaw === 'ihut' ? testTypeRaw : null
    const sessionRaw = row.session_count
    const session_count =
      typeof sessionRaw === 'number' && Number.isFinite(sessionRaw) ? sessionRaw : null

    return {
      ...(row as unknown as OperatorStudyRow),
      status: status as OperatorStudyRow['status'],
      lifecycle_state: normalizeLifecycle(row.lifecycle_state, status),
      test_type,
      session_count,
      target_completions: target,
      max_claims: maxClaims,
      total_claims:
        typeof row.total_claims === 'number' && Number.isFinite(row.total_claims)
          ? row.total_claims
          : 0,
      completed_claims:
        typeof row.completed_claims === 'number' &&
        Number.isFinite(row.completed_claims)
          ? row.completed_claims
          : 0,
      is_finished: row.is_finished === true,
    }
  })
}
