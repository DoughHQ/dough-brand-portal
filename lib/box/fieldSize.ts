import type { BoxStudyDraft } from './types'

/**
 * An IHUT box field has five seats.
 * Cap matches publish_ihut_study FIELD_TOO_LARGE so every pair can be battled
 * (server scoring is LEAST(10, pairs); at 5 products that is a full round-robin).
 */
export const MAX_BOX_FIELD_SIZE = 5

export const MIN_BOX_FIELD_SIZE = 2

export function getBoxFieldSize(draft: BoxStudyDraft): number {
  return draft.fieldProducts.length
}

export function getBoxResolvedCount(draft: BoxStudyDraft): number {
  return draft.fieldProducts.filter((r) => r.product_id != null).length
}

export function getBoxRemainingSlots(draft: BoxStudyDraft): number {
  return Math.max(0, MAX_BOX_FIELD_SIZE - getBoxFieldSize(draft))
}

export function getBoxFieldOverBy(draft: BoxStudyDraft): number {
  return Math.max(0, getBoxFieldSize(draft) - MAX_BOX_FIELD_SIZE)
}

export function canAddBoxProduct(draft: BoxStudyDraft): boolean {
  return getBoxRemainingSlots(draft) >= 1
}
