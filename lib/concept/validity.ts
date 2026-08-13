import type { ConceptStudyDraft, PricePosture } from './types'
import { isPriced } from './price'
import { CONCEPT_PUBLISH_HINT_MESSAGES } from './errors'
import {
  editableVerificationOptions,
  templateFieldAnchor,
  validateConceptTemplateConfig,
  type TemplateConfigError,
} from './templateConfig'
import { uniquePairs } from './publish'
import { isSignedStorageUrl } from './stimuliStorage'
import {
  MAX_CONCEPT_FIELD_SIZE,
  competitorMinimum,
  duplicateCompetitorIds,
  getConceptFieldSize,
  getFieldOverBy,
  getRequiredCompetitorsRemaining,
  isFieldDeadEnd,
  resolvedCompetitors,
} from './fieldSize'
import { armLabelForIndex } from './defaults'

export type OutstandingItem = {
  message: string
  anchor: string | null
}

export type FieldValidity = {
  competitorCount: number
  conceptArmCount: number
  pairings: number
  uniquePairs: number
  priceOk: boolean
  priceMessage: string
  intentsOk: boolean
  imagesOk: boolean
  modeOk: boolean
  templateOk: boolean
  publishableMode: boolean
  fieldOk: boolean
  readyToPublish: boolean
  reasons: string[]
  outstanding: OutstandingItem[]
  /** Soft items — shown in Still needed but do not block publish. */
  softOutstanding: OutstandingItem[]
  templateErrors: TemplateConfigError[]
  hasVerificationScreener: boolean
  /** Seats used by the persisted draft (own variants + every competitor row). */
  fieldSize: number
  /** How far over the six-seat maximum this draft is, if at all. */
  fieldOverBy: number
  /** Real competitors still required by this study mode. */
  competitorsMissing: number
  /** Required competitors can no longer fit without removing something. */
  fieldDeadEnd: boolean
  fieldSizeOk: boolean
  competitorsOk: boolean
  duplicatesOk: boolean
}

/** Pairings per respondent = C(n,2) capped at scoring_rounds. */
export function pairingsPerRespondent(n: number, scoringRounds: number): number {
  if (n < 2) return 0
  return Math.min(uniquePairs(n), Math.max(1, scoringRounds))
}

export function evaluateFieldValidity(draft: ConceptStudyDraft): FieldValidity {
  const arms = draft.conceptArms
  const products = draft.products
  const total = arms.length + products.length
  const reasons: string[] = []
  const outstanding: OutstandingItem[] = []

  const modeOk = draft.stimulusMode != null
  if (!modeOk) {
    const msg = 'Choose what you are testing before building the field.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-mode' })
  }

  const categoryOk = draft.taxonomyNodeId != null
  if (!categoryOk) {
    const msg = 'Choose a category for this study.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-category' })
  }

  const publishableMode =
    draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
  if (modeOk && !publishableMode) {
    const msg = 'Question set in progress — packaging and price studies are live now.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-mode' })
  }

  if (!draft.title.trim()) {
    // Anchor follows the field. Since Section 0 Pass 2 the study name lives in
    // Setup rather than a detached card, but the id travelled with the input, so
    // `concept-study-name` still resolves — now inside Section 0.
    const msg = 'Give the study a name.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-study-name' })
  }

  if (arms.length < 1) {
    const msg = 'Add your product.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }

  // ---- the six-seat field ----------------------------------------------------
  // Own variants and real competitors share one pool of six seats.
  const fieldSize = getConceptFieldSize(draft)
  const fieldOverBy = getFieldOverBy(draft)
  const competitorMin = competitorMinimum(draft.stimulusMode)
  const competitorsMissing = getRequiredCompetitorsRemaining(draft)
  const fieldDeadEnd = isFieldDeadEnd(draft)
  const fieldSizeOk = fieldOverBy === 0

  if (fieldOverBy > 0) {
    const msg = `Remove ${fieldOverBy} item${fieldOverBy === 1 ? '' : 's'} — the field holds ${MAX_CONCEPT_FIELD_SIZE}`
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }

  if (competitorsMissing > 0) {
    const msg = fieldDeadEnd
      ? competitorsMissing === 1
        ? 'Remove a variant to make room for 1 required competitor.'
        : `Remove variants to make room for ${competitorsMissing} required competitors.`
      : resolvedCompetitors(draft).length === 0
        ? `Add at least ${competitorMin} competitor${competitorMin === 1 ? '' : 's'}`
        : `Add ${competitorsMissing} more competitor${competitorsMissing === 1 ? '' : 's'}`
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }

  // Legacy modes carry no competitor minimum of their own, but a battle still needs
  // two things to compare.
  if (competitorMin === 0 && total < 2) {
    const msg = 'A study needs at least two products in the field.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }

  const duplicateIds = duplicateCompetitorIds(draft)
  const duplicatesOk = duplicateIds.length === 0
  if (!duplicatesOk) {
    const msg = `Remove duplicate competitor${duplicateIds.length === 1 ? '' : 's'}`
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }

  const prices = [
    ...arms.map((a) => a.frozen_price),
    ...products.map((p) => p.frozen_price),
  ]
  const pricedCount = prices.filter(isPriced).length
  const allPriced = total > 0 && pricedCount === total
  const allUnpriced = pricedCount === 0
  let priceOk = true
  let priceMessage = '—'

  // Packaging + price force blind — treat as blind for validity even if draft is mid-migrate.
  const posture =
    draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
      ? 'blind'
      : draft.pricePosture

  if (posture === 'blind') {
    priceOk = allUnpriced
    priceMessage = allUnpriced
      ? '✓ blind · no prices'
      : `✗ ${pricedCount} competitor${pricedCount === 1 ? '' : 's'} still priced`
    if (!priceOk) {
      const msg = 'Blind posture requires no prices on any competitor.'
      reasons.push(msg)
      outstanding.push({ message: msg, anchor: 'concept-field' })
    }
  } else if (posture === 'realistic') {
    priceOk = allPriced
    priceMessage = allPriced
      ? '✓ all priced'
      : `✗ ${total - pricedCount} competitor${total - pricedCount === 1 ? '' : 's'} need a price`
    if (!priceOk) {
      const msg = 'Realistic posture requires every competitor to be priced.'
      reasons.push(msg)
      outstanding.push({ message: msg, anchor: 'concept-field' })
    }
  } else {
    priceOk = allPriced || allUnpriced
    priceMessage = priceOk
      ? allPriced
        ? '✓ all priced'
        : '✓ none priced'
      : `✗ ${total - pricedCount} competitor${total - pricedCount === 1 ? '' : 's'} need a price`
    if (!priceOk) {
      const msg =
        CONCEPT_PUBLISH_HINT_MESSAGES.PRICE_ASYMMETRY ??
        'Every competitor must be priced the same way — all priced, or none.'
      reasons.push(msg)
      outstanding.push({ message: msg, anchor: 'concept-field' })
    }
  }

  const armNamesOk = arms.every((a) => a.display_name.trim())
  const productIntentsOk = products.every(
    (p) =>
      !!p.battle_intent &&
      p.battle_intent !== 'own_concept_arm' &&
      p.product_id != null &&
      p.frozen_display_name.trim()
  )
  const intentsOk = armNamesOk && productIntentsOk
  if (!armNamesOk) {
    const msg =
      arms.length > 1 ? 'Give every variant a product name.' : 'Give your product a name.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }
  if (!productIntentsOk && products.length > 0) {
    const msg = 'Finish choosing a product for every competitor.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }

  const needsImages =
    draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
  const imagesOk =
    !needsImages ||
    arms.every((a) => {
      const ref = a.image_url?.trim()
      return !!ref && !isSignedStorageUrl(ref)
    })
  if (needsImages && !imagesOk) {
    arms.forEach((a, i) => {
      const ref = a.image_url?.trim()
      if (ref && !isSignedStorageUrl(ref)) return
      const msg =
        arms.length > 1
          ? `Upload pack image for Variant ${a.arm_label || armLabelForIndex(i)}`
          : 'Upload the pack image for your product'
      reasons.push(msg)
      outstanding.push({ message: msg, anchor: 'concept-field' })
    })
  }

  const isTemplateMode =
    draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
  const templateErrors = isTemplateMode
    ? validateConceptTemplateConfig(
        draft.templateConfig,
        draft.stimulusMode as 'package' | 'price'
      )
    : []
  const templateOk = !isTemplateMode || templateErrors.length === 0
  for (const err of templateErrors) {
    reasons.push(err.message)
    outstanding.push({ message: err.message, anchor: err.anchor })
  }

  const softOutstanding: OutstandingItem[] = []
  const verificationBrands = isTemplateMode
    ? editableVerificationOptions(draft.templateConfig)
    : []
  const hasVerificationScreener = verificationBrands.length >= 2
  if (isTemplateMode && categoryOk && verificationBrands.length === 0) {
    softOutstanding.push({
      message: 'Add verification brands',
      anchor: templateFieldAnchor('verification_options'),
    })
  }

  if (draft.scoringRounds < 1 || draft.scoringRounds > 10) {
    const msg = 'Battle rounds must be between 1 and 10.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-q-scoring_rounds' })
  }

  if (!draft.targetCompletions || draft.targetCompletions < 1) {
    const msg = 'Set a target completion count so the study can close when full.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-q-scoring_rounds' })
  }

  if (!draft.expiresAt) {
    const msg = 'Set an expiry date.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-q-scoring_rounds' })
  }

  const competitorsOk = competitorsMissing === 0
  const fieldOk =
    arms.length >= 1 &&
    fieldSizeOk &&
    competitorsOk &&
    duplicatesOk &&
    (competitorMin > 0 || total >= 2) &&
    priceOk &&
    intentsOk &&
    imagesOk &&
    draft.title.trim().length > 0

  const readyToPublish =
    modeOk &&
    categoryOk &&
    publishableMode &&
    fieldOk &&
    templateOk &&
    draft.targetCompletions >= 1 &&
    !!draft.expiresAt &&
    draft.scoringRounds >= 1 &&
    draft.scoringRounds <= 10

  return {
    competitorCount: total,
    conceptArmCount: arms.length,
    pairings: pairingsPerRespondent(total, draft.scoringRounds),
    uniquePairs: uniquePairs(total),
    priceOk,
    priceMessage,
    intentsOk,
    imagesOk,
    modeOk,
    templateOk,
    publishableMode,
    fieldOk,
    readyToPublish,
    reasons,
    outstanding,
    softOutstanding,
    templateErrors,
    hasVerificationScreener,
    fieldSize,
    fieldOverBy,
    competitorsMissing,
    fieldDeadEnd,
    fieldSizeOk,
    competitorsOk,
    duplicatesOk,
  }
}

export function pricePostureHelp(posture: PricePosture): string {
  if (posture === 'blind') return 'No prices shown — pure preference without a buy signal.'
  if (posture === 'variable') {
    return 'Prices may differ — tests willingness across price points.'
  }
  return 'Every competitor priced · closest to a real buy signal.'
}

export function stimulusModeLabel(mode: ConceptStudyDraft['stimulusMode']): string {
  if (!mode) return '—'
  const map: Record<NonNullable<ConceptStudyDraft['stimulusMode']>, string> = {
    package: 'Packaging',
    name: 'Name',
    flavor: 'Flavor',
    claim: 'Claim',
    positioning: 'Positioning',
    price: 'Price',
    full_concept: 'Full concept',
  }
  return map[mode]
}
