/** Classify PostgREST / RPC errors from `get_product_master` and write RPCs. */

export type RpcHint =
  | 'STALE_WRITE'
  | 'HUMAN_VERIFIED_LOCKED'
  | 'PRODUCT_IS_TOMBSTONE'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_NOT_EDITABLE'
  | 'PRODUCT_BRAND_ATTRIBUTION_UNRESOLVED'
  | 'PRODUCT_IS_BRAND_AGNOSTIC'
  | 'CROSS_TENANT_ACCESS_DENIED'
  | 'NOT_A_BRAND_PORTAL_USER'
  | 'CAPABILITY_REQUIRED'
  | 'FIELD_NOT_EDITABLE'
  | 'SKU_NOT_FOUND'
  | 'NUTRITION_NOT_FOUND'
  | 'INGREDIENTS_NOT_FOUND'
  | 'INVALID_PRICE'
  | 'EMPTY_PATCH'
  | 'PATH_NOT_OWNED'
  | 'OBJECT_NOT_FOUND'
  | string

export type RpcErrorLike = {
  message?: string
  hint?: string | null
  details?: string | null
  code?: string
}

export function parseErrorDetails(details: string | null | undefined): Record<string, unknown> | null {
  if (!details) return null
  try {
    const parsed = JSON.parse(details) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    /* DETAIL is sometimes plain prose */
  }
  return null
}

export function getHint(error: RpcErrorLike | null | undefined): RpcHint | null {
  return (error?.hint as RpcHint | undefined) ?? null
}

export function looksLikeMissingRpc(error: RpcErrorLike): boolean {
  const msg = error.message ?? ''
  return /could not find the function|schema cache|PGRST202/i.test(msg)
}

export function humanizeRpcError(error: RpcErrorLike): string {
  const hint = getHint(error)
  const detail = parseErrorDetails(error.details)

  if (looksLikeMissingRpc(error) || hint === 'FUNCTION_NOT_FOUND') {
    return 'Product master isn’t available on this database yet (missing get_product_master).'
  }

  switch (hint) {
    case 'STALE_WRITE':
      return 'This product changed while you were editing.'
    case 'HUMAN_VERIFIED_LOCKED':
      return 'Dough verified this against the label. Contact us to change it.'
    case 'PRODUCT_IS_TOMBSTONE':
      return 'This product was merged into another. Redirecting…'
    case 'PRODUCT_NOT_FOUND':
    case 'CROSS_TENANT_ACCESS_DENIED':
      return 'Product not found.'
    case 'PRODUCT_NOT_EDITABLE': {
      const status = typeof detail?.status === 'string' ? detail.status : null
      return status
        ? `This product is ${status} and can’t be edited.`
        : 'This product can’t be edited.'
    }
    case 'PRODUCT_BRAND_ATTRIBUTION_UNRESOLVED':
      return 'We’re still confirming who owns this product. Contact us to resolve it.'
    case 'PRODUCT_IS_BRAND_AGNOSTIC':
      return 'This is a generic product with no brand owner.'
    case 'NOT_A_BRAND_PORTAL_USER':
      return 'You don’t have brand portal access.'
    case 'CAPABILITY_REQUIRED':
      return 'Your role can’t open this product (missing products.read).'
    case 'FIELD_NOT_EDITABLE':
      return 'That field isn’t editable here.'
    case 'SKU_NOT_FOUND':
    case 'NUTRITION_NOT_FOUND':
    case 'INGREDIENTS_NOT_FOUND':
      return 'This package changed. Reloading…'
    case 'INVALID_PRICE':
      return 'Price must be greater than zero.'
    case 'EMPTY_PATCH':
      return 'Nothing to save.'
    case 'PATH_NOT_OWNED':
      return 'Image upload path must be under your brand folder.'
    case 'OBJECT_NOT_FOUND':
      return 'Upload didn’t finish before registration. Try again.'
    default:
      return error.message?.trim() || 'Something went wrong. Try again.'
  }
}
