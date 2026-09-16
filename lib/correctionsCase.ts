/**
 * Phase 0 case desk — product identity, one claim sentence, one mode.
 * Safe for client imports (no server modules).
 */

import {
  PHOTO_ONLY_TYPES,
  canApproveAsIs,
  type CorrectionReviewRow,
  type TaxonomySearchHit,
} from '@/lib/corrections.shared'

export type CorrectionCaseMode = 'confirm' | 'assign' | 'extract'

export const FIELD_LABELS: Record<string, string> = {
  name: 'Product name',
  brand: 'Brand',
  category: 'Category',
  ingredients: 'Ingredients',
  nutrition_facts: 'Nutrition facts',
  allergens: 'Allergens',
  price: 'Price',
  product_image: 'Product image',
  other: 'Other',
}

export function correctionCaseMode(row: CorrectionReviewRow): CorrectionCaseMode {
  const ct = (row.correction_type ?? '').toLowerCase()
  if (PHOTO_ONLY_TYPES.has(ct)) return 'extract'
  if (!canApproveAsIs(row)) return 'assign'
  return 'confirm'
}

/** Drop duplicated ", PREFIX" tails from ALL-CAPS display names. */
export function collapseDuplicatedDisplayName(name: string): string {
  const trimmed = name.trim()
  const idx = trimmed.lastIndexOf(', ')
  if (idx < 0) return trimmed
  const head = trimmed.slice(0, idx).trim()
  const tail = trimmed.slice(idx + 2).trim()
  if (tail && head.toUpperCase().startsWith(tail.toUpperCase())) return head
  return trimmed
}

/** Soften screaming ALL-CAPS labels without touching mixed-case names. */
export function softenDisplayName(name: string): string {
  const collapsed = collapseDuplicatedDisplayName(name)
  const letters = collapsed.replace(/[^A-Za-z]/g, '')
  if (letters.length < 8) return collapsed
  if (letters !== letters.toUpperCase()) return collapsed
  return collapsed
    .toLowerCase()
    .replace(/(^|[\s/(&\-])([a-z])/g, (_, prefix: string, ch: string) => prefix + ch.toUpperCase())
}

export function productTitle(row: CorrectionReviewRow): string {
  const short = row.product_name_short?.trim()
  if (short) return softenDisplayName(short)
  const display = row.product_name_display?.trim()
  if (display) return softenDisplayName(display)
  return `Product ${row.product_id}`
}

export function formatCategoryPath(path: string | null | undefined): string | null {
  if (!path || !path.trim()) return null
  const parts = path
    .split(/\s*>\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
  const stripped =
    parts[0] && parts[0].toLowerCase() === 'all products' ? parts.slice(1) : parts
  if (stripped.length === 0) return null
  return stripped.join(' · ')
}

export function fieldLabel(row: CorrectionReviewRow): string {
  const ct = (row.correction_type ?? 'other').toLowerCase()
  return FIELD_LABELS[ct] ?? row.correction_type ?? 'Correction'
}

export function assignSearchSeed(row: CorrectionReviewRow): string {
  const other = row.other_category_description?.trim()
  if (other) return other
  const short = row.product_name_short?.trim()
  if (short) return short
  const display = row.product_name_display?.trim()
  if (display) return collapseDuplicatedDisplayName(display)
  return ''
}

function reviewReason(row: CorrectionReviewRow): string | null {
  const fromProposed = (row.proposed_value as { review_reason?: string } | null)?.review_reason
  const fromClaude = (row.claude_corrected_value as { review_reason?: string } | null)?.review_reason
  return fromProposed ?? fromClaude ?? null
}

export function claimCopy(row: CorrectionReviewRow): { field: string; headline: string; sentence: string } {
  const ct = (row.correction_type ?? 'other').toLowerCase()
  const field = fieldLabel(row)
  const current = row.current_category?.trim() || 'the current category'
  const other = row.other_category_description?.trim()
  const notes = row.user_notes?.trim()
  const reason = reviewReason(row)

  if (ct === 'category') {
    if (other) {
      return {
        field,
        headline: 'Category looks wrong',
        sentence: `They say this belongs with “${other},” not ${current}.`,
      }
    }
    if (reason === 'no_match_auto_classify') {
      return {
        field,
        headline: 'Category needs a home',
        sentence: 'The classifier could not place this product. Pick a category.',
      }
    }
    if (reason === 'low_confidence_auto_classify') {
      return {
        field,
        headline: 'Category needs a check',
        sentence: `Filed in ${current} with low confidence. Confirm or change it.`,
      }
    }
    if (row.proposed_category_label) {
      return {
        field,
        headline: 'Category change',
        sentence: `They want ${current} → ${row.proposed_category_label}.`,
      }
    }
    return {
      field,
      headline: 'Category looks wrong',
      sentence: `Pick the right shelf. It is currently in ${current}.`,
    }
  }

  if (PHOTO_ONLY_TYPES.has(ct)) {
    return {
      field,
      headline: ct === 'ingredients' ? 'Ingredients from a label photo' : 'Nutrition from a label photo',
      sentence: notes
        ? `A label photo was sent. ${notes}`
        : 'A label photo was sent. Read it and apply the facts.',
    }
  }

  if (ct === 'name') {
    const proposed = String(
      (row.proposed_value as { name?: string } | null)?.name ?? ''
    ).trim()
    return {
      field,
      headline: 'Name looks wrong',
      sentence: proposed
        ? `They say the name should be “${proposed}.”`
        : 'They sent a name correction.',
    }
  }

  if (ct === 'brand') {
    const proposed = String(
      (row.proposed_value as { brand_name?: string; brand?: string } | null)?.brand_name
        ?? (row.proposed_value as { brand?: string } | null)?.brand
        ?? ''
    ).trim()
    return {
      field,
      headline: 'Brand looks wrong',
      sentence: proposed
        ? `They say the brand should be “${proposed}.”`
        : 'They sent a brand correction.',
    }
  }

  if (ct === 'product_image') {
    return {
      field,
      headline: 'New product photo',
      sentence: 'They sent a photo to replace the live image.',
    }
  }

  if (notes) {
    return {
      field,
      headline: `${field} correction`,
      sentence: notes,
    }
  }

  return {
    field,
    headline: `${field} correction`,
    sentence: 'A structured change is waiting for review.',
  }
}

export function waitingAge(iso: string, nowMs: number): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const days = Math.floor((nowMs - then) / 86_400_000)
  if (days < 0) return 'Just in'
  if (days < 1) return 'Waiting today'
  if (days === 1) return 'Waiting 1 day'
  if (days < 14) return `Waiting ${days} days`
  if (days < 60) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? 'Waiting 1 week' : `Waiting ${weeks} weeks`
  }
  const months = Math.max(1, Math.floor(days / 30))
  return months === 1 ? 'Waiting 1 month' : `Waiting ${months} months`
}

function normalizeBrand(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[,.]/g, '')
    .replace(/\b(llc|inc|ltd|co|company|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function brandsLookDifferent(a: string, b: string): boolean {
  const left = normalizeBrand(a)
  const right = normalizeBrand(b)
  if (!left || !right) return false
  return left !== right
}

export function brandCatalogMismatch(opts: {
  brandId: number | null
  brandName: string | null
  workspaceBrandId: number | null
  workspaceBrandName: string | null
}): string | null {
  const catalog = opts.workspaceBrandName?.trim() || null
  const onRecord = opts.brandName?.trim() || null
  if (opts.workspaceBrandId == null && !catalog) return null

  if (
    opts.workspaceBrandId != null &&
    opts.brandId != null &&
    opts.workspaceBrandId !== opts.brandId
  ) {
    return `Brand on record is ${onRecord ?? 'unknown'}. This catalog is ${catalog ?? 'a different brand'}.`
  }

  if (catalog && onRecord && brandsLookDifferent(catalog, onRecord)) {
    return `Brand on record is ${onRecord}. This catalog is ${catalog}.`
  }

  return null
}

/** Mismatch is work, not a footnote. Category apply does not fix ownership. */
export function brandMismatchWork(opts: {
  brandId: number | null
  brandName: string | null
  workspaceBrandId: number | null
  workspaceBrandName: string | null
  correctionType: string | null
}): { sentence: string; thisClaimFixesIt: boolean } | null {
  const sentence = brandCatalogMismatch(opts)
  if (!sentence) return null
  return {
    sentence,
    thisClaimFixesIt: (opts.correctionType ?? '').toLowerCase() === 'brand',
  }
}

export function relatedBrandClaim<T extends { correction_type: string | null }>(
  rows: T[]
): T | null {
  return rows.find((r) => (r.correction_type ?? '').toLowerCase() === 'brand') ?? null
}

/** Prefer an exact / containing name match — never the first unrelated hit. */
export function preferredTaxonomyHit(
  hits: TaxonomySearchHit[],
  query: string
): TaxonomySearchHit | null {
  const q = query.trim().toLowerCase()
  if (!q || hits.length === 0) return null
  const exact = hits.find((h) => (h.node_name_display ?? '').trim().toLowerCase() === q)
  if (exact) return exact
  const contained = hits.find((h) => {
    const n = (h.node_name_display ?? '').trim().toLowerCase()
    if (!n) return false
    if (n.includes(q)) return true
    return q.includes(n) && n.length >= 12
  })
  return contained ?? null
}

export function primaryVerb(mode: CorrectionCaseMode, ct: string): string {
  if (mode === 'extract') return 'Extract from photo'
  if (mode === 'assign') {
    if (ct === 'category') return 'Choose category'
    return 'Enter a value'
  }
  if (ct === 'category') return 'Apply this category'
  if (ct === 'product_image') return 'Apply new photo'
  return `Apply ${FIELD_LABELS[ct]?.toLowerCase() ?? 'change'}`
}
