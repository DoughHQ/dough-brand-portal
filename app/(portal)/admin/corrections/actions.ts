'use server'

import {
  extractCorrectionLabel,
  reviewCorrectionSubmission,
  searchBrands,
  searchTaxonomyNodes,
} from '@/lib/corrections'
import type { TaxonomySearchHit } from '@/lib/corrections.shared'

export async function reviewCorrectionAction(
  submissionId: string,
  decision: 'approved' | 'rejected' | 'overridden',
  opts?: {
    correctedValue?: Record<string, unknown> | null
    skuVariantId?: number | null
    notes?: string | null
  }
): Promise<{ ok: boolean; error?: string }> {
  return reviewCorrectionSubmission(submissionId, decision, opts)
}

export async function extractCorrectionAction(
  submissionId: string
): Promise<{ ok: boolean; extracted_value?: Record<string, unknown>; error?: string }> {
  return extractCorrectionLabel(submissionId)
}

export async function searchTaxonomyAction(query: string): Promise<TaxonomySearchHit[]> {
  return searchTaxonomyNodes(query)
}

export async function searchBrandsAction(
  query: string
): Promise<Array<{ brand_id: number; brand_name: string }>> {
  return searchBrands(query)
}
