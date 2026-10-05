import type { BoxEligibilityDraft, BoxFieldRow, BoxStudyDraft } from './types'
import {
  IHUT_DEFAULT_ATTRIBUTES,
  IHUT_DEFAULT_SUCCESS_BARS,
} from './method'
import {
  IHUT_RESPONDENT_WINDOW_DAYS,
  ihutHiddenBackstopAt,
} from './completionContract'

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
    day2LiveWithIt: false,
    session2IntervalHours: 48,
    eligibilityTier: 'any',
    eligibility: createEmptyBoxEligibility(),
    blindSponsor: false,
    abandonWindowDays: IHUT_RESPONDENT_WINDOW_DAYS,
    unitCostCents: null,
    sourcingNotes: '',
    expiresAt: ihutHiddenBackstopAt(now),
    targetCompletions: null,
    battleQuestion: '',
    ihutAttributes: [...IHUT_DEFAULT_ATTRIBUTES],
    ihutBrandQuestions: [],
    ihutSuccessBars: { ...IHUT_DEFAULT_SUCCESS_BARS },
    updatedAt: now.toISOString(),
  }
}

export function createEmptyBoxFieldRow(): BoxFieldRow {
  return {
    localId: newId(),
    kind: 'product',
    role: 'competitor',
    product_id: null,
    prototype_id: null,
    packaging: 'final_packaging',
    price: null,
    prototypeSnapshot: null,
    frozen_display_name: '',
    frozen_brand_name: '',
    frozen_image_url: null,
    taxonomy_node_id: null,
    l2_node_id: null,
    upc: null,
    barcodeOptions: [],
    frozen_category: null,
    identityConfirmed: false,
    allergensContains: null,
    allergensMayContain: null,
    allergensConfirmed: false,
    allergensCatalogStatus: null,
  }
}
