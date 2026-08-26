import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { looksLikeMissingRpc, type RpcErrorLike } from '@/lib/productMaster/errors'
import { getOperatorStudies } from '@/lib/studies/fetchOperatorStudies'
import { parseOperatorStudyRows } from '@/lib/studies/parseOperatorStudies'
import {
  toProductStudyCards,
  type ProductStudyCard,
} from './productHeroStudies'

const RPC = 'list_product_hero_studies'

/**
 * Studies where this product is the hero and the session brand owns or
 * co-sponsors. Falls back to owned operator studies filtered by focal id
 * if the product-scoped RPC is not deployed yet.
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
  if (looksLikeMissingRpc(err)) {
    logHandledRpcFailure(RPC, {
      code: err.code ?? null,
      message: err.message ?? null,
      details: typeof err.details === 'string' ? err.details : null,
      hint: err.hint ?? null,
      brandId: opts.brandId ?? null,
      reason: 'rpc_missing_fallback_operator_list',
    })
    try {
      const owned = await getOperatorStudies({
        includeFinished: true,
        includeDrafts: false,
        brandId: opts.brandId ?? null,
      })
      return toProductStudyCards(owned, opts.productId)
    } catch (fallback) {
      logHandledRpcFailure('list_operator_studies', {
        code: null,
        message: fallback instanceof Error ? fallback.message : String(fallback),
        details: null,
        hint: null,
        brandId: opts.brandId ?? null,
        reason: 'product_hero_studies_fallback_failed',
      })
      return []
    }
  }

  logHandledRpcFailure(RPC, {
    code: err.code ?? null,
    message: err.message ?? null,
    details: typeof err.details === 'string' ? err.details : null,
    hint: err.hint ?? null,
    brandId: opts.brandId ?? null,
  })
  return []
}
