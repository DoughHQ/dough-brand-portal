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
  MISSING_BATTLE_INTENT:
    'Every competitor needs a role (competitor / job-to-be-done / your arm).',
  INVALID_BATTLE_INTENT: "That competitor role isn't valid.",
  NO_BATTLE_QUESTION: "The battle stage is missing — this shouldn't happen; reload.",
  CAMPAIGN_NOT_FOUND: 'Pick or create a campaign for this study.',
  NOT_A_BRAND_PORTAL_USER: "You don't have access to that brand.",
  CROSS_TENANT_ACCESS_DENIED: "You don't have access to that brand.",
  NOT_AUTHORIZED: "You don't have access to that brand.",
  FORBIDDEN: "You don't have access to that brand.",
  NO_AUTHOR: 'Publish requires an authenticated author.',
}

export type ConceptErrorSection =
  | 'title'
  | 'mode'
  | 'field'
  | 'questions'
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

/** Prefer wrapper `detail` for returned errors; map HINT codes only for thrown ones. */
export function resolvePublishError(args: {
  returned?: { error?: unknown; detail?: unknown } | null
  thrown?: { message?: string; hint?: string } | null
}): { text: string; section: ConceptErrorSection; code: string | null } {
  if (args.returned) {
    const code =
      typeof args.returned.error === 'string' ? args.returned.error : null
    const detail =
      typeof args.returned.detail === 'string' && args.returned.detail.trim()
        ? args.returned.detail.trim()
        : null
    if (detail) {
      return {
        text: detail,
        section: sectionForCode(code ?? ''),
        code,
      }
    }
    if (code) {
      return {
        text: code,
        section: sectionForCode(code),
        code,
      }
    }
  }

  if (args.thrown) {
    const hint =
      typeof args.thrown.hint === 'string' && args.thrown.hint.trim()
        ? args.thrown.hint.trim()
        : null
    const humanized = humanizeConceptPublishHint(hint, args.thrown.message)
    return { text: humanized.text, section: humanized.section, code: hint }
  }

  return {
    text: 'Something went wrong. Please try again.',
    section: 'publish',
    code: null,
  }
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
    code === 'DUPLICATE_COMPETITOR' ||
    code === 'NO_CONCEPT_ARM' ||
    code === 'NO_CONCEPT_ARMS' ||
    code === 'PRICE_ASYMMETRY' ||
    code === 'MISSING_BATTLE_INTENT' ||
    code === 'INVALID_BATTLE_INTENT' ||
    code === 'INVALID_PRICE_POSTURE' ||
    code === 'CONCEPT_STIMULUS_MISMATCH'
  ) {
    return 'field'
  }
  if (
    code === 'INVALID_SESSION_COUNT' ||
    code === 'S2_INTERVAL_MUST_BE_NULL' ||
    code === 'S2_INTERVAL_TOO_SMALL' ||
    code === 'INVALID_SCORING_ROUNDS' ||
    code === 'NO_BATTLE_QUESTION' ||
    code === 'MISSING_TEMPLATE_CONFIG' ||
    code === 'UNRESOLVED_TEMPLATE_TOKEN' ||
    RETURNED_ERROR_CODES.has(code)
  ) {
    return 'questions'
  }
  return 'publish'
}
