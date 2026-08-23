/**
 * Draft → wire mapping for publish_study (p_test_type = 'ihut').
 *
 * Wire discipline that matters:
 * - p_field.box_products is `{ product_id, upc }[]`. Every row that ships, hero
 *   included, must have a resolved barcode. Incomplete rows are NEVER dropped
 *   on the wire — publish is blocked instead (a silent drop would fail
 *   FOCAL_NOT_IN_FIELD / FIELD_TOO_SMALL). frozen_* and barcodeOptions stay
 *   draft-only.
 * - Unset eligibility keys are OMITTED, not sent as null. The RPC treats a
 *   PRESENT key as "this rule participates" — a present-but-null key would
 *   create an empty mission_eligibility_rules row.
 * - Session count is derived from MODULE_LOYALTY: when loyaltyFollowUp is on,
 *   that module is included and p_session2_interval_hours must be >= 24.
 */
import type { BoxStudyDraft, PublishBoxStudyArgs } from './types'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import { MODULE_LOYALTY, type StudyModuleCode } from '@/lib/study/modules'

export function boxEligibilityToWire(
  draft: BoxStudyDraft
): Record<string, unknown> | null {
  const e = draft.eligibility
  const wire: Record<string, unknown> = {}

  if (e.targetStates.length > 0) {
    wire.target_states = e.targetStates.map((s) => s.trim()).filter(Boolean)
  }
  if (e.targetCountries.length > 0) {
    wire.target_countries = e.targetCountries.map((s) => s.trim()).filter(Boolean)
  }
  if (e.requiredDietaryFlags.length > 0) {
    wire.required_dietary_flags = e.requiredDietaryFlags
  }
  if (e.allowedGenders.length > 0) {
    wire.allowed_genders = e.allowedGenders
  }
  if (e.minAge != null) wire.min_age = e.minAge
  if (e.maxAge != null) wire.max_age = e.maxAge
  if (e.minAccountAgeDays != null) wire.min_account_age_days = e.minAccountAgeDays
  if (e.qualifyingTaxonomyNodeId != null) {
    wire.qualifying_taxonomy_node_id = e.qualifyingTaxonomyNodeId
  }
  if (e.minCategoryBattles != null) wire.min_category_battles = e.minCategoryBattles
  if (e.minCategoryTries != null) wire.min_category_tries = e.minCategoryTries
  if (e.minCategoryLevel != null) wire.min_category_level = e.minCategoryLevel

  return Object.keys(wire).length > 0 ? wire : null
}

export function draftToBoxPublishArgs(
  draft: BoxStudyDraft,
  ctx: { campaignId: string; createdBy: string; open?: boolean }
): PublishBoxStudyArgs {
  if (draft.taxonomyNodeId == null) throw new Error('CATEGORY_REQUIRED')
  if (draft.focalProductId == null) throw new Error('FOCAL_REQUIRED')
  if (draft.physicalUnits == null) throw new Error('INVALID_UNITS')

  const resolved = draft.fieldProducts.filter(
    (r): r is typeof r & { product_id: number } => r.product_id != null
  )
  if (resolved.some((r) => !r.upc?.trim() || !isIdentityConfirmed(r))) {
    throw new Error('UPC_REQUIRED')
  }
  const upcs = resolved.map((r) => r.upc!.trim())
  if (new Set(upcs).size !== upcs.length) {
    throw new Error('DUPLICATE_FIELD_UPC')
  }

  const modules: StudyModuleCode[] = draft.loyaltyFollowUp ? [MODULE_LOYALTY] : []

  const args: PublishBoxStudyArgs = {
    p_test_type: 'ihut',
    p_brand_campaign_id: ctx.campaignId,
    p_brand_id: draft.brandId,
    p_title: draft.title.trim(),
    p_taxonomy_node_id: draft.taxonomyNodeId,
    p_field: {
      box_products: resolved.map((r) => ({
        product_id: r.product_id,
        upc: r.upc!.trim(),
      })),
      focal_product_id: draft.focalProductId,
    },
    p_modules: modules,
    p_physical_units: draft.physicalUnits,
    p_eligibility_tier: draft.eligibilityTier,
    p_blind_sponsor: draft.blindSponsor,
    p_abandon_window_days: draft.abandonWindowDays,
    p_expires_at: draft.expiresAt,
    p_created_by: ctx.createdBy,
    p_open: ctx.open === true,
  }

  if (draft.loyaltyFollowUp) {
    args.p_session2_interval_hours = draft.session2IntervalHours
  }

  const eligibility = boxEligibilityToWire(draft)
  if (eligibility) args.p_eligibility = eligibility

  if (draft.unitCostCents != null) args.p_unit_cost_cents = draft.unitCostCents
  if (draft.sourcingNotes.trim()) args.p_sourcing_notes = draft.sourcingNotes.trim()
  if (draft.targetCompletions != null) {
    args.p_target_completions = draft.targetCompletions
  }
  const battlePrompt = draft.battleQuestion.trim()
  if (battlePrompt) args.p_battle_prompt = battlePrompt

  return args
}
