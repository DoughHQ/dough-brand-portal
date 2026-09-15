import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { looksLikeMissingRpc, type RpcErrorLike } from '@/lib/productMaster/errors'
import { parseOperatorStudyRows } from '@/lib/studies/parseOperatorStudies'
import {
  toProductStudyCards,
  type ProductStudyCard,
} from './productHeroStudies'

const RPC = 'list_product_hero_studies'

/**
 * Studies where this product is the hero and the session brand owns or
 * co-sponsors. Fail closed if the product-scoped RPC is missing — never
 * fall back to unbounded list_operator_studies.
 */
export async function fetchProductHeroStudies(opts: {
  productId: number
  brandId?: number | null
}): Promise<ProductStudyCard[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc(RPC as never, {
    p_product_id: opts.productId,
  } as never)

  if (!error) {
    return toProductStudyCards(parseOperatorStudyRows(data), opts.productId, {
      alreadyHeroScoped: true,
    })
  }

  const err = error as RpcErrorLike
  logHandledRpcFailure(RPC, {
    code: err.code ?? null,
    message: err.message ?? null,
    details: typeof err.details === 'string' ? err.details : null,
    hint: err.hint ?? null,
    brandId: opts.brandId ?? null,
    reason: looksLikeMissingRpc(err) ? 'rpc_missing_fail_closed' : 'rpc_error',
  })
  return []
}
