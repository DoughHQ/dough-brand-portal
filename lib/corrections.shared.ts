/**
 * Client-safe corrections helpers.
 * No next/headers, no Supabase server client — safe for 'use client' imports.
 */

export type CorrectionReviewRow = {
  id: string
  product_id: number
  created_at: string
  correction_type: string | null
  product_name_display: string | null
  product_name_short: string | null
  brand_name: string | null
  brand_id: number | null
  current_category: string | null
  current_category_path: string | null
  current_value: Record<string, unknown> | null
  proposed_value: Record<string, unknown> | null
  extracted_value: Record<string, unknown> | null
  extracted_at: string | null
  extraction_error: string | null
  human_corrected_value: Record<string, unknown> | null
  user_notes: string | null
  evidence_image_url: string | null
  product_image_url: string | null
  proposed_taxonomy_node_id: number | null
  proposed_category_label: string | null
  proposed_category_path: string | null
  other_category_description: string | null
  proposed_price_amount: number | string | null
  proposed_price_store: string | null
  proposed_price_unit: string | null
  claude_decision: string | null
  claude_confidence: number | string | null
  claude_reasoning: string | null
  claude_corrected_value: Record<string, unknown> | null
  status: string | null
  variant_count: number
  variants: Array<{ sku_variant_id: number; label: string }>
}

export type CorrectionReviewsPageCursor = {
  createdAt: string
  id: string
}

export type CorrectionReviewsPage = {
  rows: CorrectionReviewRow[]
  hasMore: boolean
  nextCursor: CorrectionReviewsPageCursor | null
}

export type TaxonomySearchHit = {
  taxonomy_node_id: number
  node_name_display: string | null
  path_names_csv: string | null
  node_level: number | null
  is_leaf: boolean | null
}

export function blankCorrectionRow(
  patch: Partial<CorrectionReviewRow> & Pick<CorrectionReviewRow, 'id'>
): CorrectionReviewRow {
  return {
    product_id: 0,
    created_at: '',
    correction_type: null,
    product_name_display: null,
    product_name_short: null,
    brand_name: null,
    brand_id: null,
    current_category: null,
    current_category_path: null,
    current_value: null,
    proposed_value: null,
    extracted_value: null,
    extracted_at: null,
    extraction_error: null,
    human_corrected_value: null,
    user_notes: null,
    evidence_image_url: null,
    product_image_url: null,
    proposed_taxonomy_node_id: null,
    proposed_category_label: null,
    proposed_category_path: null,
    other_category_description: null,
    proposed_price_amount: null,
    proposed_price_store: null,
    proposed_price_unit: null,
    claude_decision: null,
    claude_confidence: null,
    claude_reasoning: null,
    claude_corrected_value: null,
    status: null,
    variant_count: 0,
    variants: [],
    ...patch,
  }
}

/** Types where the user supplies a photo and structured proposed_value is empty/`{}`. */
export const PHOTO_ONLY_TYPES = new Set(['nutrition_facts', 'ingredients'])

export function isBlankLeaf(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (typeof v === 'number') return !Number.isFinite(v)
  if (typeof v === 'boolean') return false
  if (Array.isArray(v)) return v.length === 0 || v.every(isBlankLeaf)
  if (typeof v === 'object') {
    const vals = Object.values(v as Record<string, unknown>)
    return vals.length === 0 || vals.every(isBlankLeaf)
  }
  return false
}

/** True when approving as-is would apply nothing meaningful (§6.1 / empty-value guard). */
export function isEmptyApplicableProposal(row: CorrectionReviewRow): boolean {
  const ct = (row.correction_type ?? '').toLowerCase()
  if (PHOTO_ONLY_TYPES.has(ct)) return true

  if (ct === 'category') {
    if (row.proposed_taxonomy_node_id != null) return false
    const pv = row.proposed_value
    const nodeId = pv?.taxonomy_node_id
    return nodeId == null || nodeId === ''
  }

  if (ct === 'product_image') {
    const url =
      (row.proposed_value?.image_url as string | undefined) ??
      row.evidence_image_url
    return !url || String(url).trim() === ''
  }

  if (ct === 'price') {
    return row.proposed_price_amount == null && isBlankLeaf(row.proposed_value)
  }

  return isBlankLeaf(row.proposed_value)
}

export function canApproveAsIs(row: CorrectionReviewRow): boolean {
  return !isEmptyApplicableProposal(row)
}

/** Human reason Approve is disabled — shown in review UI instead of a silent dash. */
export function approveBlockedReason(row: CorrectionReviewRow): string | null {
  if (canApproveAsIs(row)) return null
  const ct = (row.correction_type ?? '').toLowerCase()
  if (PHOTO_ONLY_TYPES.has(ct)) {
    return 'Extract the values from the photo, then apply them.'
  }
  if (ct === 'category') {
    const reason =
      (row.proposed_value?.review_reason as string | undefined) ??
      (row.claude_corrected_value?.review_reason as string | undefined)
    if (reason === 'no_match_auto_classify') {
      return 'The classifier could not match this product. Pick a category.'
    }
    if (reason === 'low_confidence_auto_classify') {
      return 'Low-confidence classification — confirm or pick a different category.'
    }
    return 'Pick a category — nothing is ready to apply yet.'
  }
  return 'Enter a value, or reject this report.'
}
