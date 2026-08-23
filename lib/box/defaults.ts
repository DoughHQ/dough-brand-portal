import type { BoxEligibilityDraft, BoxFieldRow, BoxStudyDraft } from './types'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `box_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyBoxEligibility(): BoxEligibilityDraft {
  return {
    targetStates: [],
    targetCountries: [],
    requiredDietaryFlags: [],
    allowedGenders: [],
    minAge: null,
    maxAge: null,
    minAccountAgeDays: null,
    qualifyingTaxonomyNodeId: null,
    qualifyingNodeLabel: null,
    minCategoryBattles: null,
    minCategoryTries: null,
    minCategoryLevel: null,
  }
}

/**
 * brandId comes from getPortalBrandScope().effectiveBrandId — the box builder
 * is brand-scoped and impersonation-aware. There is deliberately no
 * BOX_DEFAULT_BRAND_ID.
 */
export function createEmptyBoxDraft(brandId: number): BoxStudyDraft {
  const now = new Date()
  const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  return {
    draftId: newId(),
    title: '',
    brandId,
    brandCampaignId: null,
    taxonomyNodeId: null,
    focalProductId: null,
    fieldProducts: [],
    physicalUnits: null,
    selectedModules: [],
    loyaltyFollowUp: false,
    session2IntervalHours: 48,
    eligibilityTier: 'any',
    eligibility: createEmptyBoxEligibility(),
    blindSponsor: false,
    abandonWindowDays: 14,
    unitCostCents: null,
    sourcingNotes: '',
    expiresAt: expires.toISOString(),
    targetCompletions: null,
    battleQuestion: '',
    updatedAt: now.toISOString(),
  }
}

export function createEmptyBoxFieldRow(): BoxFieldRow {
  return {
    localId: newId(),
    product_id: null,
    frozen_display_name: '',
    frozen_brand_name: '',
    frozen_image_url: null,
    taxonomy_node_id: null,
    l2_node_id: null,
    upc: null,
    barcodeOptions: [],
    frozen_category: null,
    identityConfirmed: false,
  }
}
