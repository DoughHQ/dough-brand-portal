import { isIdentityConfirmed } from '@/lib/productEntryMode'
import type { BoxStudyDraft } from './types'
import { MAX_BOX_FIELD_SIZE } from './fieldSize'
import { isAllergenConfirmed } from './allergens'
import { BOX_ANCHORS, type BoxOutstandingItem } from './validity'

export function collectBoxFieldIssues(
  draft: BoxStudyDraft,
  outstanding: BoxOutstandingItem[],
  softOutstanding: BoxOutstandingItem[],
): { fieldOk: boolean; fieldSize: number } {
  // ---- field -----------------------------------------------------------
  const seats = draft.fieldProducts
  const fieldSize = seats.length
  const yoursCount = seats.filter((r) => r.role === 'yours').length

  const catalogSeats = seats.filter((r) => r.kind !== 'prototype')
  const prototypeSeats = seats.filter((r) => r.kind === 'prototype')

  const unresolvedCatalog = catalogSeats.filter((r) => r.product_id == null)
  const unresolvedPrototype = prototypeSeats.filter((r) => !r.prototype_id)
  const rowsResolvedOk =
    unresolvedCatalog.length === 0 && unresolvedPrototype.length === 0
  if (!rowsResolvedOk) {
    const n = unresolvedCatalog.length + unresolvedPrototype.length
    outstanding.push({
      message:
        n === 1
          ? 'Finish choosing a catalog product or ready prototype for one seat.'
          : `Finish choosing identities for ${n} seats.`,
      anchor: BOX_ANCHORS.field,
    })
  }

  const sizeOk = fieldSize >= 2
  if (!sizeOk && rowsResolvedOk) {
    outstanding.push({
      message: 'A box needs at least two seats to battle.',
      anchor: BOX_ANCHORS.field,
    })
  }

  const fieldOverBy = Math.max(0, draft.fieldProducts.length - MAX_BOX_FIELD_SIZE)
  const fieldSizeCapOk = fieldOverBy === 0
  if (!fieldSizeCapOk) {
    outstanding.push({
      message:
        fieldOverBy === 1
          ? `Remove 1 seat — the box holds ${MAX_BOX_FIELD_SIZE}.`
          : `Remove ${fieldOverBy} seats — the box holds ${MAX_BOX_FIELD_SIZE}.`,
      anchor: BOX_ANCHORS.field,
    })
  }

  const yoursOk = yoursCount >= 1
  if (!yoursOk && rowsResolvedOk) {
    outstanding.push({
      message: 'Mark at least one seat as Yours.',
      anchor: BOX_ANCHORS.field,
    })
  }

  const productIds = catalogSeats
    .map((r) => r.product_id)
    .filter((id): id is number => id != null)
  const dupes = productIds.filter((id, i) => productIds.indexOf(id) !== i)
  const dupesOk = dupes.length === 0
  if (!dupesOk) {
    outstanding.push({
      message: 'Remove duplicate catalog products — a repeated product would battle itself.',
      anchor: BOX_ANCHORS.field,
    })
  }

  const prototypeIds = prototypeSeats
    .map((r) => r.prototype_id)
    .filter((id): id is string => !!id)
  const dupProtos = prototypeIds.filter((id, i) => prototypeIds.indexOf(id) !== i)
  const dupProtoOk = dupProtos.length === 0
  if (!dupProtoOk) {
    outstanding.push({
      message: 'Remove duplicate prototypes — each ready sample can only appear once.',
      anchor: BOX_ANCHORS.field,
    })
  }

  const missingUpc = catalogSeats.filter(
    (r) => r.product_id != null && !r.upc?.trim()
  )
  const upcOk = missingUpc.length === 0
  if (!upcOk && rowsResolvedOk && sizeOk) {
    outstanding.push({
      message:
        missingUpc.length === 1
          ? 'Identify the barcode on one catalog product.'
          : `Identify the barcode on ${missingUpc.length} catalog products.`,
      anchor: BOX_ANCHORS.field,
    })
  }

  const unconfirmed = catalogSeats.filter(
    (r) => r.product_id != null && r.upc?.trim() && !isIdentityConfirmed(r)
  )
  const confirmedOk = unconfirmed.length === 0
  if (!confirmedOk && upcOk) {
    outstanding.push({
      message:
        unconfirmed.length === 1
          ? 'Confirm the catalog product in the box.'
          : `Confirm ${unconfirmed.length} catalog products in the box.`,
      anchor: BOX_ANCHORS.field,
    })
  }

  const allergenPending = catalogSeats.filter(
    (r) =>
      r.product_id != null &&
      r.upc?.trim() &&
      isIdentityConfirmed(r) &&
      !isAllergenConfirmed(r)
  )
  const allergensOk = allergenPending.length === 0
  if (!allergensOk && confirmedOk && upcOk) {
    outstanding.push({
      message:
        allergenPending.length === 1
          ? 'Confirm allergens from the package label for one catalog product.'
          : `Confirm allergens from the package label for ${allergenPending.length} catalog products.`,
      anchor: BOX_ANCHORS.field,
    })
  }

  const notReadyProtos = prototypeSeats.filter((r) => {
    const snap = r.prototypeSnapshot
    if (!r.prototype_id) return true
    if (!snap) return false
    return (
      snap.archived_at != null ||
      snap.allergens_declared_at == null ||
      !(snap.image_paths?.length > 0)
    )
  })
  const prototypesReadyOk = notReadyProtos.length === 0
  if (!prototypesReadyOk && rowsResolvedOk) {
    outstanding.push({
      message:
        notReadyProtos.length === 1
          ? 'One prototype still needs images and a declared allergen list.'
          : `${notReadyProtos.length} prototypes still need images and declared allergens.`,
      anchor: BOX_ANCHORS.field,
    })
  }

  const upcs = catalogSeats
    .map((r) => r.upc?.trim())
    .filter((u): u is string => !!u)
  const dupUpcs = upcs.filter((u, i) => upcs.indexOf(u) !== i)
  const dupUpcOk = dupUpcs.length === 0
  if (!dupUpcOk) {
    outstanding.push({
      message:
        'The same barcode is on two catalog products. Each package needs its own UPC.',
      anchor: BOX_ANCHORS.field,
    })
  }

  const tasteOnly = seats.some((r) => r.packaging === 'plain_sample')
  if (tasteOnly) {
    softOutstanding.push({
      message:
        'A plain sample makes this study taste-only — respondents will not see or judge shelf price.',
      anchor: BOX_ANCHORS.field,
    })
  }
  const priced = seats.every(
    (r) => typeof r.price === 'number' && Number.isFinite(r.price) && r.price > 0
  )
  if (!tasteOnly && !priced && seats.length >= 2) {
    softOutstanding.push({
      message:
        'Incomplete pricing · price checks off. Add a positive shelf price on every packaged seat to enable tested-offer intent and the buy-at-price decision bar.',
      anchor: BOX_ANCHORS.field,
    })
  }

  const fieldOk =
    rowsResolvedOk &&
    sizeOk &&
    fieldSizeCapOk &&
    yoursOk &&
    dupesOk &&
    dupProtoOk &&
    upcOk &&
    confirmedOk &&
    allergensOk &&
    prototypesReadyOk &&
    dupUpcOk

  return { fieldOk, fieldSize }
}
