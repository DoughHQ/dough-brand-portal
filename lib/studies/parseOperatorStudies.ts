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

export function normalizeLifecycle(
  raw: unknown,
  fallbackStatus: string | undefined
): OperatorStudyLifecycleState {
  if (typeof raw === 'string' && LIFECYCLE_STATES.has(raw as OperatorStudyLifecycleState)) {
    return raw as OperatorStudyLifecycleState
  }
  if (fallbackStatus === 'draft') return 'draft'
  if (fallbackStatus === 'completed') return 'completed'
  if (fallbackStatus === 'expired') return 'expired'
  if (fallbackStatus === 'archived') return 'archived'
  if (fallbackStatus === 'paused') return 'paused'
  return 'active'
}

/** Parse `list_operator_studies` / `list_product_hero_studies` rows. Never invent completions. */
export function parseOperatorStudyRows(data: unknown): OperatorStudyRow[] {
  const rows = Array.isArray(data) ? data : []
  return rows.map((row) => {
    const rec = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>
    const status = typeof rec.status === 'string' ? rec.status : 'active'
    const targetRaw = rec.target_completions
    const target =
      typeof targetRaw === 'number' && Number.isFinite(targetRaw) && targetRaw > 0
        ? targetRaw
        : null
    const maxClaimsRaw = rec.max_claims
    const maxClaims =
      typeof maxClaimsRaw === 'number' && Number.isFinite(maxClaimsRaw) && maxClaimsRaw > 0
        ? maxClaimsRaw
        : null
    const testTypeRaw = rec.test_type
    const test_type: OperatorStudyRow['test_type'] =
      testTypeRaw === 'concept' || testTypeRaw === 'ihut' ? testTypeRaw : null
    const sessionRaw = rec.session_count
    const session_count =
      typeof sessionRaw === 'number' && Number.isFinite(sessionRaw) ? sessionRaw : null

    return {
      ...(rec as unknown as OperatorStudyRow),
      status: status as OperatorStudyRow['status'],
      lifecycle_state: normalizeLifecycle(rec.lifecycle_state, status),
      test_type,
      session_count,
      target_completions: target,
      max_claims: maxClaims,
      total_claims:
        typeof rec.total_claims === 'number' && Number.isFinite(rec.total_claims)
          ? rec.total_claims
          : 0,
      completed_claims:
        typeof rec.completed_claims === 'number' && Number.isFinite(rec.completed_claims)
          ? rec.completed_claims
          : 0,
      is_finished: rec.is_finished === true,
      is_campaign_owner:
        rec.is_campaign_owner === false
          ? false
          : rec.is_campaign_owner === true
            ? true
            : undefined,
    }
  })
}
