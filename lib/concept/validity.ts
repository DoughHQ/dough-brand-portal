import type { ConceptStudyDraft, PricePosture, ProductCompetitorRow } from './types'
import { collectConceptAudienceIssues } from './conceptAudienceChecks'
import { collectConceptFieldIssues } from './conceptFieldChecks'
import { CONCEPT_PUBLISH_HINT_MESSAGES } from './errors'
import {
  editableVerificationOptions,
  templateFieldAnchor,
  type TemplateConfigError,
} from './templateConfig'
import { uniquePairs } from './publish'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import { fieldingDaysMessage } from '@/lib/studies/fieldingWindow'

export const CONCEPT_ANCHORS = {
  mode: 'concept-mode',
  category: 'concept-category',
  field: 'concept-field',
  questions: 'concept-questions',
  audience: 'concept-audience',
  audienceCategoryBars: 'concept-aud-category-bars',
  audienceStates: 'concept-aud-states',
  modules: 'concept-modules',
  battleSettings: 'concept-battle-settings',
} as const

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
  audienceOk: boolean
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

  const publishableMode = draft.stimulusMode === 'package'
  if (modeOk && !publishableMode) {
    const msg = 'Packaging is the only study type for this test.'
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

  const {
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
  } = collectConceptFieldIssues(draft, reasons, outstanding)


  const softOutstanding: OutstandingItem[] = []
  const verificationBrands = isTemplateMode
    ? editableVerificationOptions(draft.templateConfig)
    : []
  const hasVerificationScreener = verificationBrands.length >= 2
  if (isTemplateMode && categoryOk && verificationBrands.length === 0) {
    const msg = 'Add at least two verification brands.'
    reasons.push(msg)
    outstanding.push({
      message: msg,
      anchor: templateFieldAnchor('verification_options'),
    })
  }
  if (isTemplateMode && verificationBrands.length === 1) {
    const msg = 'Add at least two real brands, or none at all.'
    reasons.push(msg)
    outstanding.push({
      message: msg,
      anchor: templateFieldAnchor('verification_options'),
    })
  }

  const minCompletions = 30
  if (!draft.targetCompletions || draft.targetCompletions < minCompletions) {
    const msg = 'Set target completions to at least 30.'
    reasons.push(msg)
    outstanding.push({ message: msg, anchor: 'field_target_completions' })
  }

  const fieldingMessage = fieldingDaysMessage(draft.fieldingDays)
  if (fieldingMessage) {
    reasons.push(fieldingMessage)
    outstanding.push({ message: fieldingMessage, anchor: 'field_expires_at' })
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

  const audienceOk = collectConceptAudienceIssues(
    draft,
    reasons,
    outstanding,
    softOutstanding,
  )


  const readyToPublish =
    modeOk &&
    categoryOk &&
    publishableMode &&
    fieldOk &&
    templateOk &&
    audienceOk &&
    draft.targetCompletions >= 30 &&
    fieldingDaysMessage(draft.fieldingDays) == null &&
    hasVerificationScreener

  return {
    competitorCount: total,
    conceptArmCount: arms.length,
    pairings: uniquePairs(total),
    uniquePairs: uniquePairs(total),
    priceOk,
    priceMessage,
    intentsOk,
    imagesOk,
    modeOk,
    templateOk,
    publishableMode,
    fieldOk,
    audienceOk,
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

export type ConceptPublishFailure = {
  hint: string | null
  productId?: number | null
  upc?: string | null
}

/** Per-row UPC / duplicate errors on real-product competitors. Arms never get these. */
export function conceptProductRowErrors(
  products: ProductCompetitorRow[],
  failure?: ConceptPublishFailure | null
): Record<string, string> {
  const errors: Record<string, string> = {}
  const resolved = products.filter((p) => p.product_id != null)

  for (const p of resolved) {
    if (!p.upc?.trim()) {
      errors[p.localId] =
        (p.barcodeOptions?.length ?? 0) > 1
          ? 'Pick the SKU that was tested.'
          : 'Identify the exact SKU for this competitor.'
    } else if (!isIdentityConfirmed(p)) {
      errors[p.localId] = 'Confirm this competitor before it goes in the field.'
    }
  }

  const byUpc = new Map<string, string[]>()
  for (const p of resolved) {
    const upc = p.upc?.trim()
    if (!upc) continue
    const ids = byUpc.get(upc) ?? []
    ids.push(p.localId)
    byUpc.set(upc, ids)
  }
  for (const ids of byUpc.values()) {
    if (ids.length < 2) continue
    for (const localId of ids) {
      errors[localId] =
        CONCEPT_PUBLISH_HINT_MESSAGES.DUPLICATE_FIELD_UPC ??
        'Two competitors share the same UPC. Pick a different SKU for one of them.'
    }
  }

  const byProduct = new Map<number, string[]>()
  for (const p of resolved) {
    if (p.product_id == null) continue
    const ids = byProduct.get(p.product_id) ?? []
    ids.push(p.localId)
    byProduct.set(p.product_id, ids)
  }
  for (const ids of byProduct.values()) {
    if (ids.length < 2) continue
    for (const localId of ids) {
      errors[localId] =
        CONCEPT_PUBLISH_HINT_MESSAGES.DUPLICATE_COMPETITOR ??
        'The same competitor is in the field twice. Remove one — a repeated product would battle itself.'
    }
  }

  if (!failure?.hint) return errors

  const hint = failure.hint
  const target = resolved.filter((p) => {
    if (failure.productId != null && p.product_id === failure.productId) return true
    if (failure.upc && p.upc?.trim() === failure.upc.trim()) return true
    return false
  })
  const attach = (rows: typeof resolved, message: string) => {
    for (const p of rows) errors[p.localId] = message
  }

  if (hint === 'UPC_INVALID') {
    attach(
      target.length > 0 ? target : resolved.filter((p) => p.upc?.trim()),
      CONCEPT_PUBLISH_HINT_MESSAGES.UPC_INVALID
    )
  } else if (hint === 'UPC_PRODUCT_MISMATCH') {
    attach(
      target.length > 0 ? target : resolved.filter((p) => p.upc?.trim()),
      CONCEPT_PUBLISH_HINT_MESSAGES.UPC_PRODUCT_MISMATCH
    )
  } else if (hint === 'DUPLICATE_FIELD_UPC') {
    const dupRows = failure.upc
      ? resolved.filter((p) => p.upc?.trim() === failure.upc!.trim())
      : resolved.filter((p) => {
          const upc = p.upc?.trim()
          return upc != null && (byUpc.get(upc)?.length ?? 0) > 1
        })
    attach(
      dupRows,
      CONCEPT_PUBLISH_HINT_MESSAGES.DUPLICATE_FIELD_UPC
    )
  } else if (hint === 'DUPLICATE_COMPETITOR') {
    attach(
      target.length > 0
        ? target
        : resolved.filter((p) => {
            const id = p.product_id
            return id != null && (byProduct.get(id)?.length ?? 0) > 1
          }),
      CONCEPT_PUBLISH_HINT_MESSAGES.DUPLICATE_COMPETITOR
    )
  }

  return errors
}
