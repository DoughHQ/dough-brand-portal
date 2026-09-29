/**
 * Study-builder feature gates.
 *
 * Audience / "who qualifies" is built and wire-ready, but V1 studies are open to
 * everyone. Keep the model and RPCs; hide the UI and force empty eligibility on
 * publish until this flips.
 *
 * Concept studies are CONCEPT_CORE_V1 only (no feature flag).
 */
export const STUDY_AUDIENCE_BUILDER_ENABLED = false
