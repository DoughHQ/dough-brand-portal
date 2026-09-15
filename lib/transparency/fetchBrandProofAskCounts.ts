import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import {
  parseBrandProofAskCounts,
  type BrandProofAskCount,
} from '@/lib/transparency/proofAskCounts'

export async function fetchBrandProofAskCounts(
  supabase: SupabaseClient<Database>,
  productId: number,
): Promise<BrandProofAskCount[]> {
  const { data, error } = await supabase.rpc('get_brand_proof_ask_counts', {
    p_product_id: productId,
  })
  if (error) {
    logHandledRpcFailure('get_brand_proof_ask_counts', {
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
      reason: 'proof-ask-inbox',
    })
    return []
  }
  return parseBrandProofAskCounts(data)
}
