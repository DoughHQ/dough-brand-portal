/**
 * UI-owned HINT → message map for thrown Postgres exceptions.
 * Returned wrapper errors surface `detail` as-is instead.
 */
export const CONCEPT_PUBLISH_HINT_MESSAGES: Record<string, string> = {
  TITLE_REQUIRED: 'Give the study a title.',
  NODE_REQUIRED: 'Pick a category for the study.',
  INVALID_PRICE_POSTURE: 'Choose a price posture.',
  INVALID_SESSION_COUNT: 'Sessions must be 1 or 2.',
  S2_INTERVAL_MUST_BE_NULL: "One-session studies don't have a session-2 wait.",
  S2_INTERVAL_TOO_SMALL: 'Two-session studies need at least a 12-hour wait.',
  INVALID_SCORING_ROUNDS: 'Battle rounds must be between 1 and 10.',
  FIELD_TOO_SMALL: 'A study needs at least two competitors.',
  DUPLICATE_COMPETITOR:
    'The same competitor is in the field twice. Remove one — a repeated product would battle itself.',
  NO_CONCEPT_ARM: 'Add at least one of your own concept arms.',
  PRICE_ASYMMETRY:
    'Every competitor must be priced the same way — all priced, or none.',
  MISSING_BATTLE_INTENT: 'Every competitor needs a role.',
  INVALID_BATTLE_INTENT: "That competitor role isn't valid.",
  UPC_REQUIRED: 'Identify the exact SKU for every real-product competitor.',
  UPC_INVALID: 'That UPC is not a valid barcode.',
  UPC_PRODUCT_MISMATCH: 'That UPC does not belong to this competitor.',
  DUPLICATE_FIELD_UPC:
    'Two competitors share the same UPC. Pick a different SKU for one of them.',
  NO_BATTLE_QUESTION: "The battle stage is missing — this shouldn't happen; reload.",
  CAMPAIGN_NOT_FOUND: 'Pick or create a campaign for this study.',
  NOT_A_BRAND_PORTAL_USER: "You don't have access to that brand.",
  CROSS_TENANT_ACCESS_DENIED: "You don't have access to that brand.",
  NOT_AUTHORIZED: "You don't have access to that brand.",
  FORBIDDEN: "You don't have access to that brand.",
  NO_AUTHOR: 'Publish requires an authenticated author.',
  INVALID_TEST_TYPE: 'Internal error: invalid study type.',
  UNKNOWN_MODULE: 'One of the selected modules is not recognized.',
  CONCEPT_REQUIRES_CORE: 'Concept studies use the single concept test.',
  NOT_A_MODULE: 'That pack is not a selectable module.',
  MODULE_TEST_TYPE_MISMATCH:
    'That module cannot be used on this kind of study.',
  SESSION_INTERVAL_INVALID:
    'Loyalty follow-up needs at least 24 hours between sessions.',
  CONCEPT_TIER_MUST_BE_ANY:
    'Concept studies cannot require prior experience with the product.',
  INVALID_ELIGIBILITY_TIER: "That experience requirement isn't valid.",
  UNKNOWN_STATE: "One of the target states isn't recognized. Use a US state name or code.",
  QUALIFYING_NODE_NOT_FOUND: 'The qualifying category no longer exists. Pick another.',
  CATEGORY_BAR_REQUIRES_NODE:
    'Category requirements need a qualifying category. Pick one, or clear the bars.',
  CATEGORY_LEVEL_OUT_OF_RANGE: 'Category level must be between 1 and 20.',
  CATEGORY_BAR_INVALID: 'Category requirements cannot be negative.',
  // Single-test / CONCEPT_CORE_V1
  NOT_ALLOWED_TO_PUBLISH:
    'Your role can view studies but not publish them; ask a brand admin.',
  TARGET_COMPLETIONS_TOO_LOW: 'Target completions must be at least 30.',
  FIELDING_WINDOW_TOO_SHORT: 'A study needs at least 7 days to run.',
  CORE_REQUIRES_BLIND: 'This study type is always blind — no prices on the field.',
  CORE_REQUIRES_PACKAGE_STIMULUS: 'Every design must be a package stimulus.',
  IMAGE_REQUIRED: 'Every design and competitor needs an image.',
  PACK_SIZE_REQUIRED: 'Pick a pack size.',
  ANCHOR_PRICE_REQUIRED: 'Set an expected retail price.',
  DECOY_REQUIRED: 'Add a fake brand name for the attention check.',
  DECOY_IS_REAL_BRAND: 'That decoy matches a real brand — pick a made-up name.',
  DECOY_LABEL_MISMATCH: 'Decoy label must match the decoy option.',
  BENCHMARK_REQUIRED: 'Mark exactly one benchmark (current pack or competitor to beat).',
  TOO_MANY_BENCHMARKS: 'Only one benchmark is allowed.',
  INVALID_BENCHMARK_ROLE: "That benchmark role isn't valid.",
  NOTHING_TO_TEST: 'Keep at least one of your designs that is not the benchmark.',
  BATTLE_PROMPT_CONFLICT: 'Use a vetted prompt or write your own — not both.',
  UNKNOWN_BATTLE_PROMPT: "That battle prompt isn't recognized.",
  INVALID_BATTLE_PROMPT: 'Custom battle prompts must be 8–120 characters and end with ?.',
  TOO_MANY_BRAND_QUESTIONS: 'You can add at most two of your own questions.',
  BRAND_QUESTION_OPTION_COUNT: 'Each of your questions needs 2–8 options.',
  DUPLICATE_BRAND_QUESTION_OPTION: 'Options on a question must be unique.',
  INVALID_BRAND_QUESTION_PROMPT: 'Brand question prompts must be 8–140 characters.',
  INVALID_BRAND_QUESTION_OPTION: 'Each option must be at most 60 characters.',
  INVALID_BRAND_QUESTION_MAX_SELECT: 'max_select must be between 1 and the option count.',
  H2H_BAR_OUT_OF_RANGE: 'Head-to-head bar must be between 0% and 100%.',
  PRICE_BAR_OUT_OF_RANGE: 'Price bar must be between 0% and 100%.',
  LIKING_NEEDS_CURRENT_PACK:
    'Liking vs current pack needs a current-pack benchmark.',
  LIKING_THRESHOLD_REQUIRED: 'Absolute liking needs a threshold.',
  LIKING_BAR_OUT_OF_RANGE: 'That liking threshold is out of range.',
  INVALID_SUCCESS_BARS: 'Check the success bars.',
  CONCEPT_CORE_EXCLUSIVE: 'This study type cannot mix other modules.',
  INVALID_TEMPLATE_VALUE: 'One of the questionnaire fields is invalid.',
  TOO_FEW_ENTITY_OPTIONS: 'Add at least two real brands for verification.',
}

export type ConceptErrorSection =
  | 'title'
  | 'mode'
  | 'field'
  | 'questions'
  | 'audience'
  | 'advanced'
  | 'publish'

const RETURNED_ERROR_CODES = new Set([
  'INVALID_STIMULUS_MODE',
  'NO_CONCEPT_ARMS',
  'CONCEPT_STIMULUS_MISMATCH',
  'MIXED_NOT_MIXED',
  'MIXED_REQUIRES_EXPLICIT_TYPES',
  'NO_TEMPLATE_FOR_MODE',
  'MISSING_TEMPLATE_CONFIG',
  'UNRESOLVED_TEMPLATE_TOKEN',
])

export function humanizeConceptPublishHint(
  hint: string | null | undefined,
  message?: string | null
): { text: string; section: ConceptErrorSection } {
  const raw = (hint ?? message ?? '').trim()
  const code = Object.keys(CONCEPT_PUBLISH_HINT_MESSAGES).find(
    (k) => raw === k || raw.startsWith(k) || raw.includes(k)
  )
  const text = code
    ? CONCEPT_PUBLISH_HINT_MESSAGES[code]!
    : raw || 'Something went wrong. Please try again.'

  return { text, section: sectionForCode(code ?? raw) }
}

export type ConceptResolvedError = {
  text: string
  section: ConceptErrorSection
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
        // fall through
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
  section: ConceptErrorSection,
  code: string | null,
  locator: { productId: number | null; upc: string | null } = {
    productId: null,
    upc: null,
  }
): ConceptResolvedError {
  return { text, section, code, productId: locator.productId, upc: locator.upc }
}

/** Prefer wrapper `detail` for returned errors; map HINT codes only for thrown ones. */
export function resolvePublishError(args: {
  returned?: { error?: unknown; detail?: unknown } | null
  thrown?: { message?: string; hint?: string; details?: string } | null
}): ConceptResolvedError {
  if (args.returned) {
    const code =
      typeof args.returned.error === 'string' ? args.returned.error : null
    const locator = locatorFromUnknown(args.returned.detail)
    const detailString =
      typeof args.returned.detail === 'string' && args.returned.detail.trim()
        ? args.returned.detail.trim()
        : null
    const detailLooksLikeJson =
      !!detailString && (detailString.startsWith('{') || detailString.startsWith('['))
    if (detailString && !detailLooksLikeJson) {
      return resolved(detailString, sectionForCode(code ?? ''), code, locator)
    }
    if (code) {
      const mapped = CONCEPT_PUBLISH_HINT_MESSAGES[code]
      return resolved(mapped ?? code, sectionForCode(code), code, locator)
    }
  }

  if (args.thrown) {
    const locator = locatorFromUnknown(args.thrown.details)
    const hint =
      typeof args.thrown.hint === 'string' && args.thrown.hint.trim()
        ? args.thrown.hint.trim()
        : null
    const humanized = humanizeConceptPublishHint(hint, args.thrown.message)
    return resolved(humanized.text, humanized.section, hint, locator)
  }

  return resolved('Something went wrong. Please try again.', 'publish', null)
}

function sectionForCode(code: string): ConceptErrorSection {
  if (code === 'TITLE_REQUIRED' || code === 'CAMPAIGN_NOT_FOUND') {
    return 'title'
  }
  if (code === 'NODE_REQUIRED') {
    return 'mode'
  }
  if (
    code === 'INVALID_STIMULUS_MODE' ||
    code === 'NO_TEMPLATE_FOR_MODE' ||
    code === 'MIXED_NOT_MIXED' ||
    code === 'MIXED_REQUIRES_EXPLICIT_TYPES'
  ) {
    return 'mode'
  }
  if (
    code === 'FIELD_TOO_SMALL' ||
    code === 'FIELD_TOO_LARGE' ||
    code === 'DUPLICATE_COMPETITOR' ||
    code === 'NO_CONCEPT_ARM' ||
    code === 'NO_CONCEPT_ARMS' ||
    code === 'PRICE_ASYMMETRY' ||
    code === 'MISSING_BATTLE_INTENT' ||
    code === 'INVALID_BATTLE_INTENT' ||
    code === 'UPC_REQUIRED' ||
    code === 'UPC_INVALID' ||
    code === 'UPC_PRODUCT_MISMATCH' ||
    code === 'DUPLICATE_FIELD_UPC' ||
    code === 'INVALID_PRICE_POSTURE' ||
    code === 'CONCEPT_STIMULUS_MISMATCH' ||
    code === 'BENCHMARK_REQUIRED' ||
    code === 'TOO_MANY_BENCHMARKS' ||
    code === 'INVALID_BENCHMARK_ROLE' ||
    code === 'NOTHING_TO_TEST' ||
    code === 'IMAGE_REQUIRED' ||
    code === 'CORE_REQUIRES_PACKAGE_STIMULUS' ||
    code === 'CORE_REQUIRES_BLIND'
  ) {
    return 'field'
  }
  if (
    code === 'CONCEPT_TIER_MUST_BE_ANY' ||
    code === 'INVALID_ELIGIBILITY_TIER' ||
    code === 'UNKNOWN_STATE' ||
    code === 'QUALIFYING_NODE_NOT_FOUND' ||
    code === 'CATEGORY_BAR_REQUIRES_NODE' ||
    code === 'CATEGORY_LEVEL_OUT_OF_RANGE' ||
    code === 'CATEGORY_BAR_INVALID'
  ) {
    return 'audience'
  }
  if (
    code === 'INVALID_SESSION_COUNT' ||
    code === 'S2_INTERVAL_MUST_BE_NULL' ||
    code === 'S2_INTERVAL_TOO_SMALL' ||
    code === 'INVALID_SCORING_ROUNDS' ||
    code === 'NO_BATTLE_QUESTION' ||
    code === 'MISSING_TEMPLATE_CONFIG' ||
    code === 'UNRESOLVED_TEMPLATE_TOKEN' ||
    code === 'DECOY_REQUIRED' ||
    code === 'DECOY_IS_REAL_BRAND' ||
    code === 'DECOY_LABEL_MISMATCH' ||
    code === 'PACK_SIZE_REQUIRED' ||
    code === 'ANCHOR_PRICE_REQUIRED' ||
    code === 'BATTLE_PROMPT_CONFLICT' ||
    code === 'UNKNOWN_BATTLE_PROMPT' ||
    code === 'INVALID_BATTLE_PROMPT' ||
    code === 'TOO_MANY_BRAND_QUESTIONS' ||
    code === 'BRAND_QUESTION_OPTION_COUNT' ||
    code === 'DUPLICATE_BRAND_QUESTION_OPTION' ||
    code === 'INVALID_BRAND_QUESTION_PROMPT' ||
    code === 'INVALID_BRAND_QUESTION_OPTION' ||
    code === 'INVALID_BRAND_QUESTION_MAX_SELECT' ||
    code === 'H2H_BAR_OUT_OF_RANGE' ||
    code === 'PRICE_BAR_OUT_OF_RANGE' ||
    code === 'LIKING_NEEDS_CURRENT_PACK' ||
    code === 'LIKING_THRESHOLD_REQUIRED' ||
    code === 'LIKING_BAR_OUT_OF_RANGE' ||
    code === 'INVALID_SUCCESS_BARS' ||
    code === 'TOO_FEW_ENTITY_OPTIONS' ||
    code === 'INVALID_TEMPLATE_VALUE' ||
    RETURNED_ERROR_CODES.has(code)
  ) {
    return 'questions'
  }
  if (code === 'TARGET_COMPLETIONS_TOO_LOW' || code === 'FIELDING_WINDOW_TOO_SHORT') {
    return 'advanced'
  }
  return 'publish'
}
