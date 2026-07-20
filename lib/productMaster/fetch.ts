import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductMaster } from './types'
import { getHint, looksLikeMissingRpc, parseErrorDetails, type RpcErrorLike } from './errors'

export type FetchMasterResult =
  | { ok: true; data: ProductMaster }
  | {
      ok: false
      hint: string | null
      message: string
      details: Record<string, unknown> | null
      error: RpcErrorLike
    }

/** Untyped until database.types.ts is regenerated. */
export async function fetchProductMaster(
  supabase: SupabaseClient,
  productId: number
): Promise<FetchMasterResult> {
  const { data, error } = await supabase.rpc('get_product_master' as never, {
    p_product_id: productId,
  } as never)

  if (error) {
    const err = error as RpcErrorLike
    const hint = looksLikeMissingRpc(err)
      ? 'FUNCTION_NOT_FOUND'
      : getHint(err)
    return {
      ok: false,
      hint,
      message: err.message ?? 'Failed to load product',
      details: parseErrorDetails(err.details),
      error: { ...err, hint: hint ?? err.hint },
    }
  }

  if (!data || typeof data !== 'object') {
    return {
      ok: false,
      hint: 'PRODUCT_NOT_FOUND',
      message: 'Product not found.',
      details: null,
      error: { message: 'empty payload', hint: 'PRODUCT_NOT_FOUND' },
    }
  }

  return { ok: true, data: data as ProductMaster }
}

export async function callWriteRpc(
  supabase: SupabaseClient,
  fn: string,
  args: Record<string, unknown>
): Promise<{ ok: true; data: unknown } | { ok: false; error: RpcErrorLike }> {
  const { data, error } = await supabase.rpc(fn as never, args as never)
  if (error) return { ok: false, error: error as RpcErrorLike }
  return { ok: true, data }
}
