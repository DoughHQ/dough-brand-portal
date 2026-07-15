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
  brand_name: string | null
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

export type TaxonomySearchHit = {
  taxonomy_node_id: number
  node_name_display: string | null
  path_names_csv: string | null
  node_level: number | null
  is_leaf: boolean | null
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
