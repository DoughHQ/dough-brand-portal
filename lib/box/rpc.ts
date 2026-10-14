/**
 * Typed wrapper for publish_ihut_study_v2. Until database.types.ts is
 * regenerated from the reset schema, the RPC name is cast once here.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { PublishBoxStudyArgs } from './types'

type Client = SupabaseClient<Database>

export async function rpcPublishBoxStudy(
  supabase: Client,
  args: PublishBoxStudyArgs
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).rpc('publish_ihut_study_v2', {
    ...args,
    p_seats: args.p_seats as unknown as Json,
    p_module_config: (args.p_module_config ?? {}) as unknown as Json,
    p_eligibility: (args.p_eligibility ?? {}) as unknown as Json,
    p_risk_declaration: args.p_risk_declaration as unknown as Json,
  })
}

type TaxonomyBoxRiskRpc = (
  fn: 'taxonomy_box_risk',
  args: { p_taxonomy_node_id: number }
) => PromiseLike<{ data: unknown; error: { message: string } | null }>

/** taxonomy_box_risk is not in database.types.ts until the next regeneration. */
export async function rpcTaxonomyBoxRisk(
  supabase: Client,
  nodeId: number
): Promise<{ data: unknown; error: { message: string } | null }> {
  return (supabase as unknown as { rpc: TaxonomyBoxRiskRpc }).rpc('taxonomy_box_risk', {
    p_taxonomy_node_id: nodeId,
  })
}
