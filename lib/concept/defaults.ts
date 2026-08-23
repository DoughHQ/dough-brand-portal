import type {
  ConceptArmRow,
  ConceptQuestionSlot,
  ConceptStudyDraft,
  PackagingTemplateConfig,
  PricePosture,
  ProductCompetitorRow,
} from './types'
import { CONCEPT_DEFAULT_BRAND_ID } from './constants'

function defaultScoringRoundsForArms(armCount: number): number {
  if (armCount < 2) return 1
  const pairs = (armCount * (armCount - 1)) / 2
  return Math.min(10, Math.max(1, pairs))
}

function id(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const ARM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function armLabelForIndex(index: number): string {
  if (index < ARM_LETTERS.length) return ARM_LETTERS[index]!
  return `arm_${index + 1}`
}

export function newConceptArm(index: number): ConceptArmRow {
  return {
    localId: id(),
    display_name: '',
    frozen_price: null,
    arm_label: armLabelForIndex(index),
    image_url: null,
    image_filename: null,
    stimulus_payload: {},
  }
}

export function newProductCompetitor(): ProductCompetitorRow {
  return {
    localId: id(),
    product_id: null,
    frozen_display_name: '',
    frozen_brand_name: '',
    frozen_image_url: null,
    frozen_price: null,
    market_reference_price: null,
    battle_intent: 'competitor',
    upc: null,
    barcodeOptions: [],
    frozen_category: null,
    identityConfirmed: false,
  }
}

export function emptyPackagingTemplateConfig(): PackagingTemplateConfig {
  return {
    category_plural: '',
    pack_size: '',
    price_display: '',
    decoy_option: '',
    verification_options: [],
    legibility_options: [],
    expected_price: '',
    price_answer_mode: 'bands',
  }
}

export function defaultDiagnostics(): ConceptQuestionSlot[] {
  return [
    {
      localId: id(),
      question_type_code: 'concept_diagnostic',
      session_number: 1,
      position: 1,
      label: 'trial_vs_regular',
      config: {
        prompt: 'Would you try this once, or buy it regularly?',
        options: ['Try once', 'Buy regularly', 'Not sure'],
        min_select: 1,
        max_select: 1,
      },
      is_required: true,
      drives_rounds: false,
    },
    {
      localId: id(),
      question_type_code: 'concept_diagnostic',
      session_number: 1,
      position: 2,
      label: 'when_where',
      config: {
        prompt: 'When or where would you use this?',
        options: ['At home', 'On the go', 'With others', 'Not sure'],
        min_select: 1,
        max_select: 1,
      },
      is_required: true,
      drives_rounds: false,
    },
  ]
}

export function defaultFloor(
  leaderName: string,
  price: string | number | null
): ConceptQuestionSlot {
  const priceBit =
    price != null && String(price).trim() !== ''
      ? ` at $${typeof price === 'number' ? price.toFixed(2) : price}`
      : ''
  const name = leaderName.trim() || 'this'
  return {
    localId: id(),
    question_type_code: 'concept_floor',
    session_number: 1,
    position: 1,
    label: 'purchase_intent',
    config: {
      prompt: `Would you actually buy ${name}${priceBit}?`,
      options: ['yes', 'maybe', 'no'],
      min_select: 1,
      max_select: 1,
    },
    is_required: true,
    drives_rounds: false,
  }
}

export function newScreener(): ConceptQuestionSlot {
  return {
    localId: id(),
    question_type_code: 'concept_screener',
    session_number: 1,
    position: 1,
    label: 'screener',
    config: {
      prompt: 'How often do you eat something sweet before bed?',
      options: ['Never', 'Rarely', 'Weekly or more', 'Most nights'],
      min_select: 1,
      max_select: 1,
      qualify_rule: { op: 'in', value: ['Weekly or more', 'Most nights'] },
    },
    is_required: true,
    drives_rounds: false,
  }
}

export function defaultExpiresAt(days = 30): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * A fresh draft is genuinely empty.
 *
 * This used to seed two blank concept arms, which meant a study the operator had
 * never touched already owed two product names and already occupied two of the
 * six field seats. Section 1 owns creation now: the empty state invites
 * "Add your product", and that action makes the first row.
 *
 * Every `conceptArms[0]` consumer was audited before this changed — publish's
 * floor prompt, the draft floor default and FieldSection's leader all use
 * optional chaining, and `defaultScoringRoundsForArms(0)` returns 1.
 */
export function createEmptyConceptDraft(
  partial?: Partial<ConceptStudyDraft>
): ConceptStudyDraft {
  const arms: ConceptArmRow[] = []
  return {
    draftId: id(),
    title: '',
    brandId: CONCEPT_DEFAULT_BRAND_ID,
    brandCampaignId: null,
    taxonomyNodeId: null,
    stimulusMode: null,
    templateConfig: emptyPackagingTemplateConfig(),
    pricePosture: 'realistic' as PricePosture,
    session2IntervalHours: 24,
    scoringRounds: defaultScoringRoundsForArms(arms.length),
    targetCompletions: 100,
    expiresAt: defaultExpiresAt(30),
    conceptArms: arms,
    products: [],
    screeners: [],
    diagnostics: defaultDiagnostics(),
    floor: defaultFloor(arms[0]?.display_name || 'this', arms[0]?.frozen_price ?? null),
    audienceDefinition: '',
    predictiveValidityOptIn: true,
    categoryIntelligenceOptIn: false,
    updatedAt: new Date().toISOString(),
    duplicatedFrom: null,
    ...partial,
  }
}
