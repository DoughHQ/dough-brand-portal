/**
 * Study-builder feature gates.
 *
 * Audience / "who qualifies" is built and wire-ready, but V1 studies are open to
 * everyone. Keep the model and RPCs; hide the UI and force empty eligibility on
 * publish until this flips.
 */
export const STUDY_AUDIENCE_BUILDER_ENABLED = false

/**
 * Single concept test (CONCEPT_CORE_V1).
 *
 * When true: packaging-only builder, journey preview, benchmark controls,
 * CONCEPT_CORE_V1 publish payload, in_review / approve, concept_test report.
 * Keep aligned with the backend pack + app runner — see concept-core-fixtures/.
 */
export const CONCEPT_SINGLE_TEST_ENABLED = true
