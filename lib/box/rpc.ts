/**
 * Typed wrapper for publish_box_study. The generated Database type already
 * contains this function (lib/database.types.ts was regenerated after the
 * migration) — if TypeScript complains the function is unknown, the fix is
 * regenerating types, NEVER `as never`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { PublishBoxStudyArgs } from './types'

type Client = SupabaseClient<Database>

export async function rpcPublishBoxStudy(
  supabase: Client,
  args: PublishBoxStudyArgs
) {
  return supabase.rpc('publish_box_study', {
    ...args,
    p_box_products: args.p_box_products as unknown as Json,
    p_eligibility: args.p_eligibility as unknown as Json | undefined,
  })
}
