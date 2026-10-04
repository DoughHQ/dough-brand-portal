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
  })
}
