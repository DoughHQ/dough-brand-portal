/**
 * Typed wrappers for the box publish RPCs.
 * JSON columns are asserted at the boundary. Null optional numbers are omitted
 * so they hit the SQL default, which is also null.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { PublishBoxStudyArgs } from './types'

type Client = SupabaseClient<Database>

export async function rpcPublishBoxStudy(
  supabase: Client,
  args: PublishBoxStudyArgs
) {
  return supabase.rpc('publish_ihut_study_v2', {
    ...args,
    p_seats: args.p_seats as unknown as Json,
    p_module_config: (args.p_module_config ?? {}) as unknown as Json,
    p_eligibility: (args.p_eligibility ?? {}) as unknown as Json,
    p_risk_declaration: args.p_risk_declaration as unknown as Json,
    p_session2_interval_hours: args.p_session2_interval_hours ?? undefined,
    p_unit_cost_cents: args.p_unit_cost_cents ?? undefined,
    p_target_completions: args.p_target_completions ?? undefined,
  })
}

export async function rpcTaxonomyBoxRisk(supabase: Client, nodeId: number) {
  return supabase.rpc('taxonomy_box_risk', {
    p_taxonomy_node_id: nodeId,
  })
}
