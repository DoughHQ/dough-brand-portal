/**
 * Client-side validity for the box builder. Same contract as the concept
 * lane: `outstanding[]` items carry {message, anchor} and drive the sticky
 * dock; `readyToPublish` gates the publish button. The SERVER is always the
 * final authority — every rule here has a matching HINT in the RPC, and
 * anything the client cannot check (state-name normalization, product
 * existence, campaign tenancy) is deliberately left to the server and mapped
 * back through lib/box/errors.ts.
 */
import { hasLoyaltyModule, resolveBoxSelectedModules } from '@/lib/study/modules'
import type { BoxStudyDraft } from './types'
import { uniquePairs } from '@/lib/concept/publish'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import { collectBoxFieldIssues } from './boxFieldChecks'
import { ihutInventoryPlan } from './completionContract'
import {
  ALCOHOL_MIN_AGE,
  alcoholDetected,
  boxRiskOutstanding,
  type BoxTaxonomyRisk,
} from './risk'

export type BoxOutstandingItem = {
  message: string
  anchor: string | null
}

/** Section/anchor ids. Batch 3 sections MUST use these exact ids. */
export const BOX_ANCHORS = {
  setup: 'box-setup',
  name: 'box-study-name',
  category: 'box-category',
  field: 'box-field',
  audience: 'box-audience',
  audienceCategoryBars: 'box-aud-category-bars',
  audienceStates: 'box-aud-states',
  battle: 'box-battle',
  method: 'box-method',
  risk: 'box-risk',
  logistics: 'box-logistics',
  units: 'box-log-units',
  sessions: 'box-log-sessions',
  expiry: 'box-log-expiry',
} as const

export type BoxValidity = {
  setupOk: boolean
  fieldOk: boolean
  audienceOk: boolean
  logisticsOk: boolean
  /** What's in this box: declaration answered, nothing restricted. */
  riskOk: boolean
  readyToPublish: boolean
  fieldSize: number
  uniquePairs: number
  /** True when no audience requirement is set at all (tier 'any' + empty
   *  eligibility) — surfaces the open-audience soft confirm before publish. */
  openAudience: boolean
  hasAnyEligibility: boolean
  outstanding: BoxOutstandingItem[]
  /** Shown in the dock, never blocks publish. */
  softOutstanding: BoxOutstandingItem[]
}

function eligibilityBarsSet(draft: BoxStudyDraft): boolean {
  const e = draft.eligibility
  return (
    e.minCategoryBattles != null ||
    e.minCategoryTries != null ||
    e.minCategoryLevel != null
  )
}

/** True when no audience restriction is set — empty filters are valid, not incomplete. */
export function isOpenAudience(draft: BoxStudyDraft): boolean {
  const e = draft.eligibility
  const hasAnyEligibility =
    e.targetStates.length > 0 ||
    e.targetCountries.length > 0 ||
    e.requiredDietaryFlags.length > 0 ||
    e.allowedGenders.length > 0 ||
    e.minAge != null ||
    e.maxAge != null ||
    e.minAccountAgeDays != null ||
    eligibilityBarsSet(draft)
  return !hasAnyEligibility && draft.eligibilityTier === 'any'
}

export function evaluateBoxValidity(
  draft: BoxStudyDraft,
  taxonomyRisk: BoxTaxonomyRisk = { status: 'idle' }
): BoxValidity {
  const outstanding: BoxOutstandingItem[] = []
  const softOutstanding: BoxOutstandingItem[] = []

  // ---- setup (identity + run scale) ------------------------------------
  const titleOk = draft.title.trim().length > 0
  if (!titleOk) {
    outstanding.push({ message: 'Give the box study a name.', anchor: BOX_ANCHORS.name })
  }

  const categoryOk = draft.taxonomyNodeId != null
  if (!categoryOk) {
    outstanding.push({
      message: 'Choose a category for this box.',
      anchor: BOX_ANCHORS.category,
    })
  }

  const inventory = ihutInventoryPlan(draft.targetCompletions)
  const targetOk = inventory != null
  if (!targetOk) {
    outstanding.push({
      message: 'Set the completed respondents this study needs.',
      anchor: BOX_ANCHORS.units,
    })
  }

  const setupScaleOk = targetOk
  const setupOk = titleOk && categoryOk && setupScaleOk

  const { fieldOk, fieldSize } = collectBoxFieldIssues(
    draft,
    outstanding,
    softOutstanding,
  )

  // Keep focalProductId optional for legacy UI; v2 seats use role=yours instead.
  // V1: audience builder is off — every box is open. Skip client gates.
  let audienceOk = true
  let openAudience = true
  if (STUDY_AUDIENCE_BUILDER_ENABLED) {
    const e = draft.eligibility
    const barsSet = eligibilityBarsSet(draft)

    const barsNodeOk = !barsSet || e.qualifyingTaxonomyNodeId != null
    if (!barsNodeOk) {
      outstanding.push({
        message: 'Category requirements need a qualifying category. Pick one, or clear the bars.',
        anchor: BOX_ANCHORS.audienceCategoryBars,
      })
    }

    const levelOk =
      e.minCategoryLevel == null ||
      (e.minCategoryLevel >= 1 && e.minCategoryLevel <= 20)
    if (!levelOk) {
      outstanding.push({
        message: 'Category level must be between 1 and 20.',
        anchor: BOX_ANCHORS.audienceCategoryBars,
      })
    }

    const barsNonNegOk =
      (e.minCategoryBattles == null || e.minCategoryBattles >= 0) &&
      (e.minCategoryTries == null || e.minCategoryTries >= 0)
    if (!barsNonNegOk) {
      outstanding.push({
        message: 'Category requirements cannot be negative.',
        anchor: BOX_ANCHORS.audienceCategoryBars,
      })
    }

    const ageOk =
      e.minAge == null || e.maxAge == null || e.minAge <= e.maxAge
    if (!ageOk) {
      outstanding.push({
        message: 'Minimum age cannot exceed maximum age.',
        anchor: BOX_ANCHORS.audience,
      })
    }

    const statesFormatOk = e.targetStates.every((s) => s.trim().length > 0)
    if (!statesFormatOk) {
      outstanding.push({
        message: 'Remove the empty state entry.',
        anchor: BOX_ANCHORS.audienceStates,
      })
    }

    audienceOk = barsNodeOk && levelOk && barsNonNegOk && ageOk && statesFormatOk

    // A qualifying node with no bars is a no-op at claim time
    // (check_mission_eligibility only applies mastery when a bar is set).
    openAudience = isOpenAudience(draft)
    if (openAudience) {
      softOutstanding.push({
        message: 'No audience requirements — any user can claim this box.',
        anchor: BOX_ANCHORS.audience,
      })
    }
    if (e.qualifyingTaxonomyNodeId != null && !barsSet) {
      softOutstanding.push({
        message: 'Category expertise needs a bar (level, tries, or battles) or it won’t restrict claims.',
        anchor: BOX_ANCHORS.audienceCategoryBars,
      })
    }
  }

  // ---- run constraints that live outside Setup chrome ------------------
  // Day 2 interval is edited under Questions; still required for publish.
  const sessionsOk =
    !hasLoyaltyModule(resolveBoxSelectedModules(draft)) ||
    draft.session2IntervalHours >= 24
  if (!sessionsOk) {
    outstanding.push({
      message: 'Loyalty follow-up needs at least 24 hours between sessions.',
      anchor: BOX_ANCHORS.sessions,
    })
  }

  const logisticsOk = setupScaleOk && sessionsOk

  const risk = boxRiskOutstanding(draft.riskDeclaration, taxonomyRisk)
  for (const message of risk.blocking) {
    outstanding.push({ message, anchor: BOX_ANCHORS.risk })
  }
  for (const message of risk.soft) {
    softOutstanding.push({ message, anchor: BOX_ANCHORS.risk })
  }
  let riskOk = risk.blocking.length === 0
  const alcohol =
    draft.riskDeclaration.containsAlcohol === true || alcoholDetected(taxonomyRisk)
  if (
    STUDY_AUDIENCE_BUILDER_ENABLED &&
    alcohol &&
    draft.eligibility.minAge != null &&
    draft.eligibility.minAge < ALCOHOL_MIN_AGE
  ) {
    riskOk = false
    outstanding.push({
      message: `Boxes with alcohol need a minimum age of ${ALCOHOL_MIN_AGE} or higher.`,
      anchor: BOX_ANCHORS.audience,
    })
  }

  const e = draft.eligibility
  const hasAnyEligibility =
    e.targetStates.length > 0 ||
    e.targetCountries.length > 0 ||
    e.requiredDietaryFlags.length > 0 ||
    e.allowedGenders.length > 0 ||
    e.minAge != null ||
    e.maxAge != null ||
    e.minAccountAgeDays != null ||
    eligibilityBarsSet(draft)

  return {
    setupOk,
    fieldOk,
    audienceOk,
    logisticsOk,
    riskOk,
    readyToPublish: setupOk && fieldOk && audienceOk && logisticsOk && riskOk,
    fieldSize,
    uniquePairs: uniquePairs(fieldSize),
    openAudience,
    hasAnyEligibility,
    outstanding,
    softOutstanding,
  }
}

export function eligibilityTierLabel(tier: BoxStudyDraft['eligibilityTier']): string {
  switch (tier) {
    case 'any':
      return 'No prior experience required'
    case 'scanned':
      return 'Has scanned the hero product'
    case 'tried':
      return 'Has tried this product'
    case 'not_tried':
      return 'Has not tried this product'
    case 'tried_scan_corroborated':
      return 'Has tried it, corroborated by a scan'
    case 'receipt_verified':
      return 'Receipt-verified purchase of the hero product'
  }
}

export type BoxPublishFailure = {
  hint: string | null
  productId?: number | null
  upc?: string | null
}

/** Per-row UPC errors for Fill the box. Prefer these over a generic toast. */
export function boxFieldRowErrors(
  draft: BoxStudyDraft,
  failure?: BoxPublishFailure | null
): Record<string, string> {
  const errors: Record<string, string> = {}
  const resolved = draft.fieldProducts.filter((r) => r.product_id != null)

  for (const r of resolved) {
    if (!r.upc?.trim()) {
      errors[r.localId] =
        (r.barcodeOptions?.length ?? 0) > 1
          ? 'Pick the barcode on the package that ships.'
          : 'Identify the barcode on this package.'
    } else if (!isIdentityConfirmed(r)) {
      errors[r.localId] = 'Confirm this product before it goes in the box.'
    }
  }

  const byUpc = new Map<string, string[]>()
  for (const r of resolved) {
    const upc = r.upc?.trim()
    if (!upc) continue
    const ids = byUpc.get(upc) ?? []
    ids.push(r.localId)
    byUpc.set(upc, ids)
  }
  for (const ids of byUpc.values()) {
    if (ids.length < 2) continue
    for (const localId of ids) {
      errors[localId] =
        'This barcode is used on another product in the box. Each package needs its own UPC.'
    }
  }

  if (!failure?.hint) return errors

  const hint = failure.hint
  const target = resolved.filter((r) => {
    if (failure.productId != null && r.product_id === failure.productId) return true
    if (failure.upc && r.upc?.trim() === failure.upc.trim()) return true
    return false
  })

  const attach = (rows: typeof resolved, message: string) => {
    for (const r of rows) errors[r.localId] = message
  }

  if (hint === 'UPC_REQUIRED') {
    attach(
      resolved.filter((r) => !r.upc?.trim()),
      'Every product in the box needs a barcode. Identify the UPC on this package.'
    )
  } else if (hint === 'UPC_INVALID') {
    attach(
      target.length > 0 ? target : resolved.filter((r) => r.upc?.trim()),
      "That barcode isn't valid. Check it against the physical package."
    )
  } else if (hint === 'UPC_PRODUCT_MISMATCH') {
    attach(
      target.length > 0 ? target : resolved.filter((r) => r.upc?.trim()),
      "That barcode doesn't belong to this product. Re-scan or re-pick."
    )
  } else if (hint === 'DUPLICATE_FIELD_UPC') {
    const dupRows =
      failure.upc
        ? resolved.filter((r) => r.upc?.trim() === failure.upc!.trim())
        : resolved.filter((r) => {
            const upc = r.upc?.trim()
            return upc != null && (byUpc.get(upc)?.length ?? 0) > 1
          })
    attach(
      dupRows,
      'This barcode is used on another product in the box. Each package needs its own UPC.'
    )
  } else if (hint === 'DUPLICATE_FIELD_PRODUCT') {
    attach(
      target.length > 0 ? target : resolved.filter((r, i, all) =>
        all.some((o, j) => j !== i && o.product_id === r.product_id)
      ),
      'This product is in the box twice. Remove one — a repeated product would battle itself.'
    )
  }

  return errors
}
