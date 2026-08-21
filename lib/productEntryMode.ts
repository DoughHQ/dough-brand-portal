import { looksLikeBarcode } from '@/lib/concept/barcodes'

export type ProductEntryMode = 'name' | 'barcode'

/**
 * explicit null = operator has not forced a mode; digits may auto-switch to barcode.
 * explicit 'name' stays name even when the query is all digits (numeric product names).
 * explicit 'barcode' stays barcode even when the query looks like a name.
 */
export function resolveEntryMode(
  explicit: ProductEntryMode | null,
  query: string
): ProductEntryMode {
  if (explicit) return explicit
  return looksLikeBarcode(query) ? 'barcode' : 'name'
}

/** Legacy drafts with a UPC are already confirmed. New picks set false until Confirm. */
export function isIdentityConfirmed(row: {
  identityConfirmed?: boolean
  upc?: string | null
}): boolean {
  if (row.identityConfirmed === true) return true
  if (row.identityConfirmed === false) return false
  return typeof row.upc === 'string' && row.upc.trim().length > 0
}

export function categoryFromSearchResult(p: {
  l3_name?: string | null
  l2_name?: string | null
  l1_name?: string | null
}): string | null {
  return p.l3_name || p.l2_name || p.l1_name || null
}
