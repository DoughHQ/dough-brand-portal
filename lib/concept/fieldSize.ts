import type { ConceptStudyDraft, ProductCompetitorRow, StimulusMode } from './types'

/**
 * A Concept Study field has six seats in total.
 *
 * The seats are shared by the brand's own concept variants AND the real competitor
 * products — it is NOT six competitors plus the own product. Every rule below derives
 * from this one constant; nothing else in the builder should hard-code 6, 2 or 1.
 */
export const MAX_CONCEPT_FIELD_SIZE = 6

/** Real competitors required before a study of this mode can publish. */
export function competitorMinimum(mode: StimulusMode | null): number {
  if (mode === 'price') return 1
  if (mode === 'package') return 2
  // Legacy, non-publishable modes make no competitor claim of their own.
  return 0
}

/** Price studies carry exactly one own product; variants are a packaging concept. */
export function supportsVariants(mode: StimulusMode | null): boolean {
  return mode !== 'price'
}

/** A competitor only exists once it resolves to a real database product. */
export function isResolvedCompetitor(row: ProductCompetitorRow): boolean {
  return row.product_id != null
}

export function resolvedCompetitors(draft: ConceptStudyDraft): ProductCompetitorRow[] {
  return draft.products.filter(isResolvedCompetitor)
}

/**
 * Seats occupied by the persisted draft.
 *
 * Every persisted row occupies a seat — including unresolved legacy rows and duplicates.
 * Those are separately invalid, but they are real entries in the draft, so counting them
 * keeps the capacity readout honest about what has to be removed. Transient add/replace
 * search UI is not persisted and therefore never occupies a seat.
 */
export function getConceptFieldSize(draft: ConceptStudyDraft): number {
  return draft.conceptArms.length + draft.products.length
}

export function getRemainingFieldSlots(draft: ConceptStudyDraft): number {
  return Math.max(0, MAX_CONCEPT_FIELD_SIZE - getConceptFieldSize(draft))
}

export function getFieldOverBy(draft: ConceptStudyDraft): number {
  return Math.max(0, getConceptFieldSize(draft) - MAX_CONCEPT_FIELD_SIZE)
}

/** Competitors still needed to satisfy this mode's minimum. */
export function getRequiredCompetitorsRemaining(draft: ConceptStudyDraft): number {
  return Math.max(0, competitorMinimum(draft.stimulusMode) - resolvedCompetitors(draft).length)
}

/**
 * True when the required competitors can no longer fit — i.e. the operator has to remove
 * something before the study can ever satisfy its own minimum.
 */
export function isFieldDeadEnd(draft: ConceptStudyDraft): boolean {
  return getConceptFieldSize(draft) + getRequiredCompetitorsRemaining(draft) > MAX_CONCEPT_FIELD_SIZE
}

export function duplicateCompetitorIds(draft: ConceptStudyDraft): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const row of resolvedCompetitors(draft)) {
    const key = String(row.product_id)
    if (seen.has(key)) dupes.add(key)
    seen.add(key)
  }
  return [...dupes]
}

export type AddAvailability =
  | { allowed: true }
  | {
      allowed: false
      reason: 'field-full' | 'reserved-for-competitors' | 'single-product-mode'
      message: string
    }

function fieldFull(): AddAvailability {
  return {
    allowed: false,
    reason: 'field-full',
    message: `Field limit reached · ${MAX_CONCEPT_FIELD_SIZE} of ${MAX_CONCEPT_FIELD_SIZE}`,
  }
}

/** Adding a competitor only needs a free seat. */
export function canAddCompetitor(draft: ConceptStudyDraft): AddAvailability {
  if (getRemainingFieldSlots(draft) < 1) return fieldFull()
  return { allowed: true }
}

/**
 * Adding a variant needs a free seat AND must leave room for every competitor the mode
 * still requires — so the operator can never fill all six seats with their own variants
 * and then discover the study can't satisfy its competitor minimum.
 */
export function canAddVariant(draft: ConceptStudyDraft): AddAvailability {
  if (!supportsVariants(draft.stimulusMode)) {
    return {
      allowed: false,
      reason: 'single-product-mode',
      message: 'Price studies test a single product.',
    }
  }
  if (getRemainingFieldSlots(draft) < 1) return fieldFull()

  const reserved = getRequiredCompetitorsRemaining(draft)
  if (getConceptFieldSize(draft) + 1 + reserved > MAX_CONCEPT_FIELD_SIZE) {
    return {
      allowed: false,
      reason: 'reserved-for-competitors',
      message:
        reserved === 1
          ? 'Keep 1 spot open for a required competitor'
          : `Keep ${reserved} spots open for competitors`,
    }
  }
  return { allowed: true }
}

/** Mode-aware competitor progress copy, shared by the column and the status strip. */
export function competitorProgressLabel(draft: ConceptStudyDraft): string {
  const n = resolvedCompetitors(draft).length
  const missing = getRequiredCompetitorsRemaining(draft)
  const noun = n === 1 ? 'competitor' : 'competitors'

  if (missing > 0 && isFieldDeadEnd(draft)) {
    return missing === 1
      ? 'Make room for 1 required competitor'
      : `Make room for ${missing} required competitors`
  }
  if (n === 0) {
    const min = competitorMinimum(draft.stimulusMode)
    return min === 1 ? 'Add at least 1 competitor' : `Add at least ${min} competitors`
  }
  if (missing > 0) {
    return `${n} ${noun} added · ${missing} more required`
  }
  if (getRemainingFieldSlots(draft) === 0) {
    return `${n} ${noun} added · field full`
  }
  return `${n} ${noun} added`
}
