/**
 * Box study — builder types (UI draft ↔ publish_study wire, p_test_type='ihut').
 *
 * publish_study creates: an active brand mission (focal product + category), a
 * protocol, optional eligibility rules, a sampling_boxes row with the field
 * frozen server-side, and a Model-A sponsor row.
 *
 * Browser "Save draft" is localStorage only and never calls this RPC.
 * "Publish box" sends p_open: true so the box is created AND opened
 * (draft → open) in one transaction and is immediately claimable.
 */

import type { ProductBarcodeOption } from '@/lib/concept/types'
import type { PrototypeListItem, PrototypePackaging } from '@/lib/prototypes/types'
import type { StudyModuleCode } from '@/lib/study/modules'

/** Mirrors the mission_eligibility_tier values the RPC accepts.
 *  The v1 builder only offers any / tried / not_tried; the others remain
 *  valid on stored drafts and on the backend. */
export type BoxEligibilityTier =
  | 'any'
  | 'scanned'
  | 'tried'
  | 'not_tried'
  | 'tried_scan_corroborated'
  | 'receipt_verified'

export type BoxProductWire = {
  product_id: number
  upc: string
}

export type BoxSeatKind = 'product' | 'prototype'
export type BoxSeatRole = 'yours' | 'competitor'
export type BoxSeatPackaging = PrototypePackaging

export type BoxSeatWire = {
  kind: BoxSeatKind
  role: BoxSeatRole
  product_id?: number
  prototype_id?: string
  upc?: string
  packaging: BoxSeatPackaging
  price?: number | null
  allergens_contains?: string[]
  allergens_may_contain?: string[]
}

/**
 * One physical product in the box. The frozen_* fields are picker display
 * only — the SERVER freezes name/brand by value at publish from the live
 * products table. product_id + upc cross the wire (respondents scan the
 * barcode to prove they tried the package).
 *
 * taxonomy_node_id / l2_node_id are also display-only: they power the
 * "different category" chip and same-L2 sort in Contents. They are never
 * sent to publish_study. barcodeOptions is draft-only SKU choice.
 */
export type BoxFieldRow = {
  localId: string
  /** Missing on v1 local drafts; normalization migrates those rows to product seats. */
  kind: BoxSeatKind
  role: BoxSeatRole
  product_id: number | null
  prototype_id: string | null
  packaging: BoxSeatPackaging
  /** Shelf price in dollars. Missing prices disable the study price check. */
  price: number | null
  /** Library snapshot used for display/readiness until publish freezes the live row. */
  prototypeSnapshot: PrototypeListItem | null
  frozen_display_name: string
  frozen_brand_name: string
  frozen_image_url: string | null
  taxonomy_node_id: number | null
  l2_node_id: number | null
  /** Validated barcode for the SKU that ships. Required on the wire. */
  upc: string | null
  /** Draft-only: barcodes to pick from when list_product_barcodes.requires_choice.
   * Never sent to publish.
   */
  barcodeOptions?: ProductBarcodeOption[]
  /** Display-only category label for the confirm step. */
  frozen_category?: string | null
  /**
   * Operator confirmed name/brand/GTIN before locking the row.
   * Undefined on legacy drafts — treated as confirmed when upc is present.
   */
  identityConfirmed?: boolean
  /**
   * Brand-confirmed allergen lists from the physical label (P0b).
   * Both arrays required when allergensConfirmed; empty = declared none.
   */
  allergensContains?: string[] | null
  allergensMayContain?: string[] | null
  allergensConfirmed?: boolean
  /** Catalog status from get_product_allergen_prefill (display only). */
  allergensCatalogStatus?: string | null
}

/**
 * Audience requirements. Every field optional; unset fields are OMITTED from
 * the wire entirely (a present-but-null key would still create an empty rules
 * row server-side). Keys here map 1:1 to the p_eligibility jsonb keys the RPC
 * parses — do not rename.
 */
export type BoxEligibilityDraft = {
  /** US states, any format ("NY" / "new york") — server normalizes via
   *  normalize_us_state and rejects unrecognized values with UNKNOWN_STATE. */
  targetStates: string[]
  /** ISO-ish country codes ("US"); server upper/trims. */
  targetCountries: string[]
  /** Constraint codes from user_dietary_constraints (e.g. "gluten_free"). */
  requiredDietaryFlags: string[]
  allowedGenders: string[]
  minAge: number | null
  maxAge: number | null
  minAccountAgeDays: number | null
  /** Category-mastery gate. Bars below REQUIRE this node (server enforces
   *  CATEGORY_BAR_REQUIRES_NODE; validity mirrors it client-side). */
  qualifyingTaxonomyNodeId: number | null
  qualifyingNodeLabel: string | null
  /** Engagement bar — battles are grindable; label it as engagement in UI. */
  minCategoryBattles: number | null
  /** Un-grindable bar — distinct completed product loops in the category. */
  minCategoryTries: number | null
  /** Un-grindable bar — level derived from tries (1–20, sum-then-map). */
  minCategoryLevel: number | null
}

export type BoxStudyDraft = {
  draftId: string
  title: string
  /** Effective brand from portal scope — never a hardcoded sandbox brand. */
  brandId: number
  brandCampaignId: string | null
  /** L3 category — must be the focal product's own node (server enforces
   *  NODE_MISMATCH). null until chosen. */
  taxonomyNodeId: number | null
  /** The hero product. Must also appear in fieldProducts (FOCAL_NOT_IN_FIELD). */
  focalProductId: number | null
  /** Everything that ships in the box, focal included. Min 2 resolved rows. */
  fieldProducts: BoxFieldRow[]
  /** How many boxes exist = the claim seat count. null until entered. */
  physicalUnits: number | null
  /**
   * Extra pickable modules. Purchase drivers and field ranking are retired from
   * IHUT; only Day 2 (MODULE_LOYALTY) remains until IHUT_CORE_V1 activates.
   */
  selectedModules: StudyModuleCode[]
  /**
   * @deprecated Derived from selectedModules.includes(MODULE_LOYALTY) /
   * day2LiveWithIt. Kept so older localStorage drafts migrate.
   */
  loyaltyFollowUp: boolean
  /** Day 2: Live with it — the only IHUT add-on. */
  day2LiveWithIt: boolean
  /** Hours between sessions. Only sent when Day 2 is on; server requires >= 24. */
  session2IntervalHours: number
  eligibilityTier: BoxEligibilityTier
  eligibility: BoxEligibilityDraft
  /** Hide the sponsoring brand from respondents (research-heavy posture). */
  blindSponsor: boolean
  /** Days after delivery (or after session-2 unlock) before a no-show is
   *  sweepable as abandoned. Server default 14. */
  abandonWindowDays: number
  unitCostCents: number | null
  sourcingNotes: string
  /** ISO timestamp. Mission + claim window end. */
  expiresAt: string
  targetCompletions: number | null
  /**
   * @deprecated Battle prompts are locked on the Dough method. Kept for draft
   * migrate; publish always sends an empty prompt for new studies.
   */
  battleQuestion: string
  /** Up to 3 just-right attributes from the generic list. */
  ihutAttributes: import('./method').IhutAttributeCode[]
  /** 0–2 brand-written closed questions. */
  ihutBrandQuestions: import('./method').IhutBrandQuestionDraft[]
  /** Brand-set go / no-go thresholds for the report. */
  ihutSuccessBars: import('./method').IhutSuccessBarsDraft
  updatedAt: string
}

/** Wire args for public.publish_ihut_study_v2. */
export type PublishBoxStudyArgs = {
  p_brand_campaign_id: string
  p_brand_id: number
  p_title: string
  p_taxonomy_node_id: number
  p_seats: BoxSeatWire[]
  p_modules: StudyModuleCode[]
  p_module_config: Record<string, unknown>
  p_physical_units: number
  p_battle_prompt: string
  p_session2_interval_hours: number | null
  p_eligibility: Record<string, unknown>
  p_eligibility_tier: string
  p_blind_sponsor: boolean
  p_abandon_window_days: number
  p_unit_cost_cents: number | null
  p_sourcing_notes: string
  p_starts_at: string
  p_expires_at: string
  p_target_completions: number | null
  p_created_by: string
  p_open: true
}

export type BoxPrototypeLabel = {
  combatant_ref: number
  prototype_id: string
  code: string
  display_name: string
  internal_label: string | null
  packaging: BoxSeatPackaging
}

/** Parsed success payload from publish_ihut_study_v2.
 *  campaignId is NOT in the RPC return — Batch 2 fills it from the draft. */
export type BoxPublishSuccessMeta = {
  missionId: string
  boxId: string
  protocolId: string | null
  campaignId: string
  field_size: number | null
  unique_pairs: number | null
  session_count: number | null
  session2_interval_hours: number | null
  eligibility_applied: boolean
  /** Real sampling_boxes.status — 'open' after a successful Publish box. */
  box_status: string | null
  /** True when the RPC opened the claim window in the same transaction. */
  publishedOpen: boolean
  /** Resolved prompt respondents will see (custom or server default). */
  battle_question: string | null
  battle_question_is_custom: boolean
  taste_only: boolean
  price_check_enabled: boolean
  prototype_labels: BoxPrototypeLabel[]
}
