import type {
  ConceptArmRow,
  ConceptQuestionSlot,
  ConceptStudyDraft,
  PricePosture,
  ProductCompetitorRow,
} from './types'
import {
  CONCEPT_DEFAULT_BRAND_ID,
  CONCEPT_DEFAULT_TAXONOMY_NODE_ID,
} from './constants'

function id(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function newConceptArm(index: number): ConceptArmRow {
  return {
    localId: id(),
    display_name: '',
    stimulus_type: 'full_concept',
    frozen_price: null,
    battle_intent: 'own_concept_arm',
    arm_label: `arm_${index + 1}`,
    image_url: null,
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
    battle_intent: 'direct_competitor',
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

export function createEmptyConceptDraft(
  partial?: Partial<ConceptStudyDraft>
): ConceptStudyDraft {
  const arms = [newConceptArm(0), newConceptArm(1)]
  return {
    draftId: id(),
    title: '',
    brandId: CONCEPT_DEFAULT_BRAND_ID,
    brandCampaignId: null,
    taxonomyNodeId: CONCEPT_DEFAULT_TAXONOMY_NODE_ID,
    pricePosture: 'realistic' as PricePosture,
    sessionCount: 1,
    session2IntervalHours: 24,
    scoringRounds: 6,
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

export function cloneDraftAsNew(source: ConceptStudyDraft): ConceptStudyDraft {
  const remap = <T extends { localId: string }>(rows: T[]): T[] =>
    rows.map((r) => ({ ...r, localId: id() }))

  return {
    ...source,
    draftId: id(),
    title: source.title ? `${source.title} (copy)` : '',
    brandCampaignId: null,
    conceptArms: remap(source.conceptArms).map((a, i) => ({
      ...a,
      arm_label: `arm_${i + 1}`,
    })),
    products: remap(source.products),
    screeners: remap(source.screeners),
    diagnostics: remap(source.diagnostics),
    floor: source.floor ? { ...source.floor, localId: id() } : null,
    updatedAt: new Date().toISOString(),
    duplicatedFrom: source.draftId,
  }
}
