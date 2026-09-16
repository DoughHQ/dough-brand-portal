'use server'

import {
  extractCorrectionLabel,
  getPendingCorrectionReviewsPage,
  reviewCorrectionSubmission,
  searchBrands,
  searchTaxonomyNodes,
  type CorrectionReviewsPage,
  type CorrectionReviewsPageCursor,
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

export async function loadMoreCorrectionsAction(opts: {
  cursor: CorrectionReviewsPageCursor
  productId?: number | null
}): Promise<CorrectionReviewsPage> {
  return getPendingCorrectionReviewsPage({
    limit: 25,
    cursor: opts.cursor,
    productId: opts.productId ?? null,
  })
}

/** Satellite of the open case — other pending claims on the same product. Not the desk. */
export async function listRelatedCorrectionsAction(
  productId: number
): Promise<CorrectionReviewsPage['rows']> {
  if (!Number.isFinite(productId) || productId <= 0) return []
  const page = await getPendingCorrectionReviewsPage({
    limit: 25,
    productId,
  })
  return page.rows
}
