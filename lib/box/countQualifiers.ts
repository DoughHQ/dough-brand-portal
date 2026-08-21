import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { BoxStudyDraft } from './types'

export type CountBoxQualifiersArgs = {
  p_focal_product_id: number
  p_eligibility_tier?: 'any' | 'tried' | 'not_tried'
  p_required_dietary_flags?: string[]
  p_min_age?: number
  p_max_age?: number
  p_allowed_genders?: string[]
  p_target_states?: string[]
  p_target_countries?: string[]
  p_min_account_age_days?: number
  p_qualifying_taxonomy_node_id?: number
  p_min_category_battles?: number
  p_min_category_tries?: number
  p_min_category_level?: number
}

export type CountBoxQualifiersResult = {
  qualifying_users: number
  total_users: number
  pass_experience: number
  pass_rules: number
  below_viable_floor: boolean
  warning: string | null
}

type CountClient = {
  rpc(
    fn: 'count_box_qualifiers',
    args: CountBoxQualifiersArgs
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function unwrapRpcJson(data: unknown): Record<string, unknown> | null {
  if (typeof data === 'string') {
    try {
      return unwrapRpcJson(JSON.parse(data) as unknown)
    } catch {
      return null
    }
  }
  const rec = asRecord(data)
  if (rec) return rec
  if (Array.isArray(data) && data.length > 0) return unwrapRpcJson(data[0])
  return null
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

export function parseCountBoxQualifiers(data: unknown): CountBoxQualifiersResult | null {
  const row = unwrapRpcJson(data)
  if (!row) return null
  const qualifying = asFiniteNumber(row.qualifying_users)
  if (qualifying == null) return null
  return {
    qualifying_users: qualifying,
    total_users: asFiniteNumber(row.total_users) ?? 0,
    pass_experience: asFiniteNumber(row.pass_experience) ?? 0,
    pass_rules: asFiniteNumber(row.pass_rules) ?? 0,
    below_viable_floor: row.below_viable_floor === true,
    warning: typeof row.warning === 'string' && row.warning.trim() ? row.warning.trim() : null,
  }
}

/** Only send filters the brand has set. Category params go only when a bar is set. */
export function boxDraftToQualifierArgs(
  draft: BoxStudyDraft
): CountBoxQualifiersArgs | null {
  if (draft.focalProductId == null) return null

  const args: CountBoxQualifiersArgs = {
    p_focal_product_id: draft.focalProductId,
  }

  const tier = draft.eligibilityTier
  if (tier === 'any' || tier === 'tried' || tier === 'not_tried') {
    args.p_eligibility_tier = tier
  }

  const e = draft.eligibility
  if (e.requiredDietaryFlags.length > 0) {
    args.p_required_dietary_flags = e.requiredDietaryFlags
  }
  if (e.minAge != null) args.p_min_age = e.minAge
  if (e.maxAge != null) args.p_max_age = e.maxAge
  if (e.allowedGenders.length > 0) args.p_allowed_genders = e.allowedGenders
  if (e.targetStates.length > 0) args.p_target_states = e.targetStates
  if (e.targetCountries.length > 0) args.p_target_countries = e.targetCountries
  if (e.minAccountAgeDays != null) {
    args.p_min_account_age_days = e.minAccountAgeDays
  }

  const barsSet =
    e.minCategoryBattles != null ||
    e.minCategoryTries != null ||
    e.minCategoryLevel != null
  if (e.qualifyingTaxonomyNodeId != null && barsSet) {
    args.p_qualifying_taxonomy_node_id = e.qualifyingTaxonomyNodeId
    if (e.minCategoryBattles != null) {
      args.p_min_category_battles = e.minCategoryBattles
    }
    if (e.minCategoryTries != null) {
      args.p_min_category_tries = e.minCategoryTries
    }
    if (e.minCategoryLevel != null) {
      args.p_min_category_level = e.minCategoryLevel
    }
  }

  return args
}

export async function rpcCountBoxQualifiers(
  supabase: SupabaseClient<Database>,
  args: CountBoxQualifiersArgs
): Promise<CountBoxQualifiersResult> {
  const { data, error } = await (supabase as unknown as CountClient).rpc(
    'count_box_qualifiers',
    args
  )
  if (error) throw new Error(error.message)
  const parsed = parseCountBoxQualifiers(data)
  if (!parsed) throw new Error('count_box_qualifiers returned an empty payload')
  return parsed
}
