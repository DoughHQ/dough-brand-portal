/**
 * UI-owned HINT → message map for publish_concept_mission.
 * Reword here without a backend change.
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
}

export type ConceptErrorSection = 'title' | 'field' | 'questions' | 'advanced' | 'publish'

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

  let section: ConceptErrorSection = 'publish'
  if (
    code === 'TITLE_REQUIRED' ||
    code === 'NODE_REQUIRED' ||
    code === 'CAMPAIGN_NOT_FOUND'
  ) {
    section = 'title'
  } else if (
    code === 'FIELD_TOO_SMALL' ||
    code === 'NO_CONCEPT_ARM' ||
    code === 'PRICE_ASYMMETRY' ||
    code === 'MISSING_BATTLE_INTENT' ||
    code === 'INVALID_BATTLE_INTENT' ||
    code === 'INVALID_PRICE_POSTURE'
  ) {
    section = 'field'
  } else if (
    code === 'INVALID_SESSION_COUNT' ||
    code === 'S2_INTERVAL_MUST_BE_NULL' ||
    code === 'S2_INTERVAL_TOO_SMALL' ||
    code === 'INVALID_SCORING_ROUNDS' ||
    code === 'NO_BATTLE_QUESTION'
  ) {
    section = 'questions'
  }

  return { text, section }
}
