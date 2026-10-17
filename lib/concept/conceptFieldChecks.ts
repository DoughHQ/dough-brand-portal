import type { ConceptStudyDraft } from './types'
import { coerceBattleIntent } from './types'
import { isPriced } from './price'
import { CONCEPT_PUBLISH_HINT_MESSAGES } from './errors'
import {
  validateConceptTemplateConfig,
  type TemplateConfigError,
} from './templateConfig'
import { isPublishableImageRef } from './stimuliStorage'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
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
import type { OutstandingItem } from './validity'

export type ConceptFieldFacts = {
  fieldSize: number
  fieldOverBy: number
  competitorsMissing: number
  fieldDeadEnd: boolean
  fieldSizeOk: boolean
  duplicatesOk: boolean
  competitorMin: number
  priceOk: boolean
  priceMessage: string
  intentsOk: boolean
  imagesOk: boolean
  templateOk: boolean
  templateErrors: TemplateConfigError[]
  isTemplateMode: boolean
}

export function collectConceptFieldIssues(
  draft: ConceptStudyDraft,
  reasons: string[],
  outstanding: OutstandingItem[],
): ConceptFieldFacts {
  const arms = draft.conceptArms
  const products = draft.products
  const total = arms.length + products.length

  // ---- the six-seat field ----------------------------------------------------
  // Own variants and real competitors share one pool of five seats.
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
  const productsResolved = products.every(
    (p) =>
      coerceBattleIntent(p.battle_intent, 'competitor') === 'competitor' &&
      p.product_id != null &&
      p.frozen_display_name.trim()
  )
  const productsUpcOk =
    productsResolved && products.every((p) => !!p.upc?.trim())
  const unconfirmedProducts = products.filter(
    (p) => p.product_id != null && p.upc?.trim() && !isIdentityConfirmed(p)
  )
  const productsConfirmedOk = unconfirmedProducts.length === 0
  const upcSeen = new Map<string, number>()
  for (const p of products) {
    const upc = p.upc?.trim()
    if (!upc) continue
    upcSeen.set(upc, (upcSeen.get(upc) ?? 0) + 1)
  }
  const duplicateUpcs = [...upcSeen.entries()].filter(([, n]) => n > 1)
  const duplicateUpcOk = duplicateUpcs.length === 0
  const intentsOk =
    armNamesOk &&
    productsResolved &&
    productsUpcOk &&
    productsConfirmedOk &&
    duplicateUpcOk
  if (!armNamesOk) {
    const msg =
      arms.length > 1 ? 'Give every variant a product name.' : 'Give your product a name.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }
  if (!productsResolved && products.length > 0) {
    const msg = 'Finish choosing a product for every competitor.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }
  if (productsResolved && !productsUpcOk && products.length > 0) {
    const unnamed = products.filter((p) => !p.upc?.trim())
    const first = unnamed[0]?.frozen_display_name.trim()
    const msg = first
      ? `Identify the exact SKU for ${first}.`
      : 'Identify the exact SKU for every competitor.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }
  if (!productsConfirmedOk) {
    const first = unconfirmedProducts[0]?.frozen_display_name.trim()
    const msg = first
      ? `Confirm the SKU for ${first}.`
      : 'Confirm every competitor SKU.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }
  if (!duplicateUpcOk) {
    const msg = 'Two competitors share the same UPC. Pick a different SKU for one of them.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
  }

  const needsImages =
    draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
  const imagesOk =
    !needsImages ||
    (arms.every((a) => isPublishableImageRef(a.image_url)) &&
      draft.products
        .filter((p) => p.product_id != null)
        .every((p) => isPublishableImageRef(p.frozen_image_url)))
  if (needsImages && !imagesOk) {
    const msg = CONCEPT_PUBLISH_HINT_MESSAGES.IMAGE_REQUIRED
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'concept-field' })
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

  return {
    fieldSize,
    fieldOverBy,
    competitorsMissing,
    fieldDeadEnd,
    fieldSizeOk,
    duplicatesOk,
    competitorMin,
    priceOk,
    priceMessage,
    intentsOk,
    imagesOk,
    templateOk,
    templateErrors,
    isTemplateMode,
  }
}
