/**
 * Draft → wire mapping for publish_ihut_study_v2.
 *
 * Seats are a discriminated catalog/prototype union. Prototypes never send
 * caller UPC or allergen arrays — the server freezes both from the library.
 * Catalog seats still require confirmed identity + allergens on the wire.
 */
import type {
  BoxFieldRow,
  BoxSeatWire,
  BoxStudyDraft,
  PublishBoxStudyArgs,
} from './types'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import {
  resolveBoxSelectedModules,
  hasLoyaltyModule,
  IHUT_CORE_V1_PUBLISH,
  MODULE_IHUT_CORE_V1,
  MODULE_IHUT_DAY2_V1,
  MODULE_LOYALTY,
  type StudyModuleCode,
} from '@/lib/study/modules'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import { isAllergenConfirmed } from './allergens'
import {
  brandQuestionsWire,
  sanitizeIhutAttributes,
  successBarsWire,
} from './method'
import { isResolvedBoxSeat } from './fieldSize'

export function boxEligibilityToWire(
  draft: BoxStudyDraft,
  opts?: { force?: boolean }
): Record<string, unknown> | null {
  if (!STUDY_AUDIENCE_BUILDER_ENABLED && !opts?.force) return null
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

function seatRole(row: BoxFieldRow): 'yours' | 'competitor' {
  return row.role === 'yours' ? 'yours' : 'competitor'
}

export function fieldRowToSeatWire(row: BoxFieldRow): BoxSeatWire {
  const packaging = row.packaging ?? 'final_packaging'
  const role = seatRole(row)
  const price =
    typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0
      ? row.price
      : null

  if (row.kind === 'prototype') {
    if (!row.prototype_id) throw new Error('PROTOTYPE_REQUIRED')
    const seat: BoxSeatWire = {
      kind: 'prototype',
      role,
      prototype_id: row.prototype_id,
      packaging,
    }
    if (price != null) seat.price = price
    return seat
  }

  if (row.product_id == null) throw new Error('PRODUCT_REQUIRED')
  if (!row.upc?.trim() || !isIdentityConfirmed(row)) throw new Error('UPC_REQUIRED')
  if (!isAllergenConfirmed(row)) throw new Error('ALLERGENS_REQUIRED')

  const seat: BoxSeatWire = {
    kind: 'product',
    role,
    product_id: row.product_id,
    upc: row.upc.trim(),
    packaging: packaging === 'plain_sample' ? 'final_packaging' : packaging,
    allergens_contains: row.allergensContains ?? [],
    allergens_may_contain: row.allergensMayContain ?? [],
  }
  if (price != null) seat.price = price
  return seat
}

export function draftToBoxPublishArgs(
  draft: BoxStudyDraft,
  ctx: { campaignId: string; createdBy: string; open?: boolean }
): PublishBoxStudyArgs {
  if (draft.taxonomyNodeId == null) throw new Error('CATEGORY_REQUIRED')
  if (draft.physicalUnits == null) throw new Error('INVALID_UNITS')
  if (draft.fieldProducts.length < 2 || draft.fieldProducts.length > 5) {
    throw new Error('FIELD_SIZE_INVALID')
  }
  if (!draft.fieldProducts.some((r) => r.role === 'yours')) {
    throw new Error('YOURS_SEAT_REQUIRED')
  }

  const seats = draft.fieldProducts.map(fieldRowToSeatWire)
  // CORE publish path: locked method pack (± Day 2). method_pack still rides
  // in module_config so the server can upgrade even if a client lags.
  const day2 =
    draft.day2LiveWithIt === true ||
    draft.loyaltyFollowUp === true ||
    hasLoyaltyModule(draft.selectedModules)
  const modules: StudyModuleCode[] = IHUT_CORE_V1_PUBLISH
    ? day2
      ? [MODULE_IHUT_CORE_V1, MODULE_IHUT_DAY2_V1]
      : [MODULE_IHUT_CORE_V1]
    : resolveBoxSelectedModules({
        ...draft,
        selectedModules: day2
          ? ['MODULE_LOYALTY']
          : draft.selectedModules.filter((m) => m === MODULE_LOYALTY),
      })
  const includeDay2 =
    day2 ||
    modules.includes(MODULE_LOYALTY) ||
    modules.includes(MODULE_IHUT_DAY2_V1)
  const hasPrototype = seats.some((s) => s.kind === 'prototype')
  const tasteOnly = draft.fieldProducts.some(
    (r) => isResolvedBoxSeat(r) && r.packaging === 'plain_sample'
  )
  const priceCheckEnabled = draft.fieldProducts
    .filter(isResolvedBoxSeat)
    .every((r) => typeof r.price === 'number' && r.price > 0)

  const args: PublishBoxStudyArgs = {
    p_brand_campaign_id: ctx.campaignId,
    p_brand_id: draft.brandId,
    p_title: draft.title.trim(),
    p_taxonomy_node_id: draft.taxonomyNodeId,
    p_seats: seats,
    p_modules: modules,
    p_module_config: {
      attributes: sanitizeIhutAttributes(draft.ihutAttributes),
      brand_questions: brandQuestionsWire(draft.ihutBrandQuestions ?? []),
      success_bars: successBarsWire(draft.ihutSuccessBars),
      taste_only: tasteOnly,
      price_check_enabled: priceCheckEnabled,
      include_day2: includeDay2,
      method_pack: 'IHUT_CORE_V1',
    },
    p_physical_units: draft.physicalUnits,
    // Locked prompts — never send a brand-authored battle string.
    p_battle_prompt: '',
    p_session2_interval_hours: includeDay2
      ? draft.session2IntervalHours
      : null,
    p_eligibility: {},
    p_eligibility_tier:
      hasPrototype || !STUDY_AUDIENCE_BUILDER_ENABLED
        ? 'any'
        : draft.eligibilityTier,
    p_blind_sponsor: draft.blindSponsor,
    p_abandon_window_days: draft.abandonWindowDays,
    p_unit_cost_cents: draft.unitCostCents,
    p_sourcing_notes: draft.sourcingNotes.trim(),
    p_starts_at: new Date().toISOString(),
    p_expires_at: draft.expiresAt,
    p_target_completions: draft.targetCompletions,
    p_created_by: ctx.createdBy,
    p_open: true,
  }

  const eligibility = boxEligibilityToWire(draft)
  if (eligibility) args.p_eligibility = eligibility

  return args
}
