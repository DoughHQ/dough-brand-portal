import { brandCorrectionsHref, correctionsDeskHref } from '@/lib/correctionsDesk'
import type { OpenCorrection } from './types'

export const IDENTITY_LABELS: Record<string, string> = {
  product_name_display: 'Display name',
  product_name_short: 'Short name',
  product_flavor_variant: 'Flavor / variant',
  product_variety: 'Variety',
  product_description: 'Description',
}

export const CORRECTION_FIELD: Record<string, string> = {
  nutrition_facts: 'nutrition',
  ingredients: 'ingredients',
  category: 'category',
  name: 'name',
  brand: 'brand',
  price: 'price',
  product_image: 'images',
  allergens: 'allergens',
  other: 'other',
}

export function catalogCorrectionHref(
  isAdmin: boolean,
  focusId: string | undefined | null
): string {
  if (!focusId) return isAdmin ? correctionsDeskHref() : brandCorrectionsHref()
  return isAdmin
    ? correctionsDeskHref({ focusId })
    : brandCorrectionsHref({ focusId })
}

export function systemFlagTitle(c: OpenCorrection): string {
  if (c.review_reason === 'no_match_auto_classify') return "We're classifying this product"
  if (c.review_reason === 'low_confidence_auto_classify') return "We're double-checking the category"
  return 'Dough is reviewing this product'
}

export function proposalHeadline(c: OpenCorrection): string {
  const summary = (c.summary ?? '').trim()
  if (summary) return summary
  const type = CORRECTION_FIELD[c.correction_type] ?? c.correction_type
  return `A ${type} change is pending review`
}

export function partitionOpenCorrections(open: OpenCorrection[] | null | undefined): {
  systemFlags: OpenCorrection[]
  proposals: OpenCorrection[]
} {
  const rows = open ?? []
  return {
    systemFlags: rows.filter((c) => c.kind === 'system_flag'),
    proposals: rows.filter((c) => c.kind !== 'system_flag'),
  }
}

export function correctionTypeSet(proposals: OpenCorrection[]): Set<string> {
  const set = new Set<string>()
  for (const c of proposals) {
    set.add(CORRECTION_FIELD[c.correction_type] ?? 'other')
  }
  return set
}

/** Includes system flags (category) so the right field lights up. */
export function pendingFieldSet(open: OpenCorrection[] | null | undefined): Set<string> {
  const set = new Set<string>()
  for (const c of open ?? []) {
    if (c.kind === 'system_flag') set.add('category')
    else set.add(CORRECTION_FIELD[c.correction_type] ?? 'other')
  }
  return set
}

export function proposalByFieldMap(proposals: OpenCorrection[]): Map<string, OpenCorrection> {
  const map = new Map<string, OpenCorrection>()
  for (const c of proposals) {
    const key = CORRECTION_FIELD[c.correction_type] ?? 'other'
    if (!map.has(key)) map.set(key, c)
  }
  return map
}
