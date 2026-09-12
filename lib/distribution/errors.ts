/** Map PostgREST HINT codes from availability RPCs to portal copy. */

const HINT_MESSAGES: Record<string, string> = {
  CROSS_TENANT_ACCESS_DENIED: "You don't have access to this product.",
  PRODUCT_BRAND_ATTRIBUTION_UNRESOLVED:
    'We need to confirm who owns this product before you can add distribution.',
  PRODUCT_IS_TOMBSTONE: 'This product has been merged into another. Open the current one.',
  PRODUCT_NOT_EDITABLE: "This product isn't editable right now.",
  PRODUCT_IS_BRAND_AGNOSTIC: 'This is a generic product with no brand owner.',
  PRODUCT_NOT_FOUND: 'Product not found.',
  NOT_A_BRAND_PORTAL_USER: "Your account isn't linked to a brand.",

  RETAILER_NOT_SHOPPABLE: "That's a parent company, not a store banner. Pick a specific banner.",
  RETAILER_ABSENT_FROM_REGION:
    "That retailer doesn't operate in the region you picked. Choose a region where they have stores.",
  REGION_GRANULARITY_INVALID: 'Choose a state or metro area.',
  LOCATION_RETAILER_MISMATCH: "That store doesn't belong to the retailer you selected.",
  SCOPE_LEVEL_INVALID: 'Choose nationwide, a state or metro, or a store.',

  REVIEW_NEEDS_REASON: 'Add a short note explaining why.',
  REPORT_NOT_FOUND: 'That shopper report is no longer available.',
  REVIEW_ACTION_INVALID: 'That review action is not supported.',
  REPORT_ALREADY_ADJUDICATED: 'Dough has already reviewed this report.',
  DECLARATION_NOT_FOUND: 'That distribution declaration was not found.',
  DELIST_DATE_FUTURE: "A delisting date can't be in the future.",
}

/** Hints that should never reach a brand UI — log and show generic copy. */
const INTERNAL_HINTS = new Set([
  'SEEDING_REQUIRES_DOUGH_ADMIN',
  'REJECTION_REQUIRES_DOUGH_ADMIN',
  'REJECTION_NEEDS_REASON',
  'NOT_AUTHENTICATED',
  'PRODUCT_NOT_SEEDABLE',
  'PRODUCT_NOT_REPORTABLE',
  'SIGHTING_NEEDS_PLACE',
])

export function messageFromDistributionError(error: {
  message?: string
  hint?: string | null
  details?: string | null
} | null): string {
  if (!error) return 'Something went wrong. Try again.'
  const hint = (error.hint || error.details || '').trim()
  if (hint && INTERNAL_HINTS.has(hint)) {
    console.warn('[distribution] unexpected internal hint', hint, error.message)
    return 'Something went wrong. Try again.'
  }
  if (hint && HINT_MESSAGES[hint]) return HINT_MESSAGES[hint]
  for (const key of Object.keys(HINT_MESSAGES)) {
    if ((error.message || '').includes(key) || hint.includes(key)) {
      return HINT_MESSAGES[key]!
    }
  }
  return 'Something went wrong. Try again.'
}

/** `can_declare_availability.reason` is a HINT code (or null when allowed). */
export function messageFromCapabilityReason(reason: string | null | undefined): string {
  if (!reason) return 'We need to confirm who owns this product before you can add distribution.'
  const code = reason.trim()
  if (HINT_MESSAGES[code]) return HINT_MESSAGES[code]!
  return messageFromDistributionError({ hint: code, message: code })
}
