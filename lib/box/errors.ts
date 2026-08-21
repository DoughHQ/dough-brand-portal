/**
 * HINT → human copy for publish_box_study. The RPC raises Postgres exceptions
 * with these exact HINT codes (it does not return {error} objects today, but
 * the resolver accepts both shapes, mirroring lib/concept/errors.ts).
 *
 * Every code below exists verbatim in the SQL. Do not invent codes here and
 * do not remove any — an unmapped code falls through to its raw text, which
 * is an acceptable degradation but never the goal.
 */

export type BoxErrorSection =
  | 'setup'
  | 'field'
  | 'audience'
  | 'logistics'
  | 'publish'

export const BOX_PUBLISH_HINT_MESSAGES: Record<string, string> = {
  // Tenancy / auth (assert_caller_owns_campaign + RPC guards)
  CAMPAIGN_NOT_FOUND: 'Pick or create a campaign for this box.',
  CAMPAIGN_DELETED: 'That campaign was deleted. Create a new one.',
  CAMPAIGN_BRAND_MISMATCH: "That campaign belongs to a different brand.",
  NOT_A_BRAND_PORTAL_USER: "You don't have access to that brand.",
  CROSS_TENANT_ACCESS_DENIED: "You don't have access to that brand.",
  NO_AUTHOR: 'Publish requires an authenticated author.',

  // Setup
  TITLE_REQUIRED: 'Give the box study a name.',
  CATEGORY_REQUIRED: 'Choose a category for this box.',
  FOCAL_REQUIRED: 'Choose the hero product this box is about.',
  PRODUCT_NOT_FOUND: "One of the selected products doesn't exist anymore. Re-pick it.",
  FOCAL_HAS_NO_NODE:
    'The hero product has no category assigned, so it cannot be studied yet.',
  NODE_MISMATCH:
    "The category must be the hero product's own category. Change one or the other.",

  // Field
  FIELD_PRODUCT_INVALID: 'One field entry is not a valid product. Re-pick it.',
  DUPLICATE_FIELD_PRODUCT:
    'The same product is in the box twice. Remove one — a repeated product would battle itself.',
  DUPLICATE_FIELD_UPC:
    'The same barcode is on two products. Each package in the box needs its own UPC.',
  FIELD_TOO_SMALL: 'A box needs at least two products to battle.',
  FOCAL_NOT_IN_FIELD: 'The hero product must ship in the box. Add it to the contents.',
  UPC_REQUIRED:
    'Every product in the box needs a barcode. Identify the UPC on each package.',
  UPC_INVALID: "That barcode isn't valid. Check it against the physical package.",
  UPC_PRODUCT_MISMATCH:
    "That barcode doesn't belong to the selected product. Re-scan or re-pick.",

  // Audience
  INVALID_ELIGIBILITY_TIER: "That experience requirement isn't valid.",
  UNKNOWN_STATE: "One of the target states isn't recognized. Use a US state name or code.",
  QUALIFYING_NODE_NOT_FOUND: 'The qualifying category no longer exists. Pick another.',
  CATEGORY_BAR_REQUIRES_NODE:
    'Category requirements need a qualifying category. Pick one, or clear the bars.',
  CATEGORY_LEVEL_OUT_OF_RANGE: 'Category level must be between 1 and 20.',
  CATEGORY_BAR_INVALID: 'Category requirements cannot be negative.',

  // Logistics
  INVALID_UNITS: 'Set how many boxes will ship (at least 1).',
  SESSION_COUNT_INVALID: 'Sessions must be 1 or 2.',
  SESSION_INTERVAL_INVALID:
    'One-session boxes have no wait; two-session boxes need at least 24 hours between sessions.',
  INVALID_WINDOW: 'The end date must be in the future, after the start.',
  INVALID_TARGET_COMPLETIONS: 'Target completions must be a positive number.',
}

/** Ordered longest-first so e.g. CATEGORY_BAR_REQUIRES_NODE is never
 *  shadowed by a shorter prefix match. */
const KNOWN_BOX_HINTS = Object.keys(BOX_PUBLISH_HINT_MESSAGES).sort(
  (a, b) => b.length - a.length
)

/** Pull a known HINT code out of a thrown Postgres error. Mirrors the
 *  concept lane's extractHint, centralized here so actions stay thin. */
export function extractBoxHint(error: {
  message?: string
  hint?: string
  code?: string
}): string | null {
  if (typeof error.hint === 'string' && error.hint.trim()) {
    const h = error.hint.trim()
    if (KNOWN_BOX_HINTS.includes(h)) return h
    return h
  }
  const msg = error.message ?? ''
  for (const code of KNOWN_BOX_HINTS) {
    if (msg === code || msg.startsWith(code) || msg.includes(code)) return code
  }
  return null
}

export function sectionForBoxCode(code: string): BoxErrorSection {
  switch (code) {
    case 'TITLE_REQUIRED':
    case 'CATEGORY_REQUIRED':
    case 'FOCAL_REQUIRED':
    case 'FOCAL_HAS_NO_NODE':
    case 'NODE_MISMATCH':
    case 'CAMPAIGN_NOT_FOUND':
    case 'CAMPAIGN_DELETED':
      return 'setup'
    case 'PRODUCT_NOT_FOUND':
    case 'FIELD_PRODUCT_INVALID':
    case 'DUPLICATE_FIELD_PRODUCT':
    case 'DUPLICATE_FIELD_UPC':
    case 'FIELD_TOO_SMALL':
    case 'FOCAL_NOT_IN_FIELD':
    case 'UPC_REQUIRED':
    case 'UPC_INVALID':
    case 'UPC_PRODUCT_MISMATCH':
      return 'field'
    case 'INVALID_ELIGIBILITY_TIER':
    case 'UNKNOWN_STATE':
    case 'QUALIFYING_NODE_NOT_FOUND':
    case 'CATEGORY_BAR_REQUIRES_NODE':
    case 'CATEGORY_LEVEL_OUT_OF_RANGE':
    case 'CATEGORY_BAR_INVALID':
      return 'audience'
    case 'INVALID_UNITS':
    case 'SESSION_COUNT_INVALID':
    case 'SESSION_INTERVAL_INVALID':
    case 'INVALID_WINDOW':
    case 'INVALID_TARGET_COMPLETIONS':
      return 'logistics'
    default:
      return 'publish'
  }
}

export type BoxResolvedError = {
  text: string
  section: BoxErrorSection
  code: string | null
  productId: number | null
  upc: string | null
}

function locatorFromUnknown(value: unknown): {
  productId: number | null
  upc: string | null
} {
  if (value == null) return { productId: null, upc: null }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>
    const rawId = rec.product_id
    const productId =
      typeof rawId === 'number' && Number.isFinite(rawId)
        ? rawId
        : typeof rawId === 'string' && rawId.trim() && Number.isFinite(Number(rawId))
          ? Number(rawId)
          : null
    const upc = typeof rec.upc === 'string' && rec.upc.trim() ? rec.upc.trim() : null
    return { productId, upc }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return { productId: null, upc: null }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return locatorFromUnknown(JSON.parse(trimmed) as unknown)
      } catch {
        // fall through to regex
      }
    }
    const pid = trimmed.match(/product_id["'\s:=]+(\d+)/i)
    const upc = trimmed.match(/\bupc["'\s:=]+["']?(\d{8,14})/i)
    return {
      productId: pid ? Number(pid[1]) : null,
      upc: upc ? upc[1]! : null,
    }
  }
  return { productId: null, upc: null }
}

function resolved(
  text: string,
  section: BoxErrorSection,
  code: string | null,
  locator: { productId: number | null; upc: string | null } = {
    productId: null,
    upc: null,
  }
): BoxResolvedError {
  return { text, section, code, productId: locator.productId, upc: locator.upc }
}

/**
 * Resolve either error shape to display copy + section. publish_box_study
 * throws today; the `returned` branch exists for forward-compatibility and
 * to mirror resolvePublishError in lib/concept/errors.ts.
 */
export function resolveBoxPublishError(args: {
  returned?: { error?: unknown; detail?: unknown } | null
  thrown?: { message?: string; hint?: string; details?: string } | null
}): BoxResolvedError {
  if (args.returned) {
    const code =
      typeof args.returned.error === 'string' ? args.returned.error : null
    const locator = locatorFromUnknown(args.returned.detail)
    const detailIsJsonObject =
      args.returned.detail != null &&
      typeof args.returned.detail === 'object' &&
      !Array.isArray(args.returned.detail)
    const detailString =
      typeof args.returned.detail === 'string' && args.returned.detail.trim()
        ? args.returned.detail.trim()
        : null
    const detailLooksLikeJson =
      !!detailString && (detailString.startsWith('{') || detailString.startsWith('['))
    if (detailString && !detailLooksLikeJson) {
      return resolved(detailString, sectionForBoxCode(code ?? ''), code, locator)
    }
    if (code) {
      const mapped = BOX_PUBLISH_HINT_MESSAGES[code]
      return resolved(
        mapped ?? code,
        sectionForBoxCode(code),
        code,
        locator
      )
    }
    if (detailIsJsonObject || detailLooksLikeJson) {
      return resolved(
        'Something went wrong. Please try again.',
        'publish',
        null,
        locator
      )
    }
  }

  if (args.thrown) {
    const locator = locatorFromUnknown(args.thrown.details)
    const hint =
      typeof args.thrown.hint === 'string' && args.thrown.hint.trim()
        ? args.thrown.hint.trim()
        : extractBoxHint({ message: args.thrown.message })
    if (hint) {
      const mapped = BOX_PUBLISH_HINT_MESSAGES[hint]
      return resolved(
        mapped ?? args.thrown.message ?? hint,
        sectionForBoxCode(hint),
        hint,
        locator
      )
    }
    if (args.thrown.message?.trim()) {
      return resolved(args.thrown.message.trim(), 'publish', null, locator)
    }
  }

  return resolved('Something went wrong. Please try again.', 'publish', null)
}
