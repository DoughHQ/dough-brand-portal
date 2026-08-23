/**
 * Typed wrapper for publish_study (ihut). Regenerate lib/database.types.ts
 * after the unified RPC lands — never cast the function name `as never`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { PublishBoxStudyArgs } from './types'

type Client = SupabaseClient<Database>

export async function rpcPublishBoxStudy(
  supabase: Client,
  args: PublishBoxStudyArgs
) {
  return supabase.rpc('publish_study', {
    ...args,
    p_field: args.p_field as unknown as Json,
    p_module_config: (args.p_module_config ?? {}) as unknown as Json,
    p_eligibility: (args.p_eligibility ?? {}) as unknown as Json,
  })
}
