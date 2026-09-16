'use server'

import {
  getBrandPendingCorrectionsPage,
  type CorrectionReviewsPage,
  type CorrectionReviewsPageCursor,
} from '@/lib/corrections'

export async function loadMoreBrandCorrectionsAction(opts: {
  cursor: CorrectionReviewsPageCursor
}): Promise<CorrectionReviewsPage> {
  return getBrandPendingCorrectionsPage({
    limit: 25,
    cursor: opts.cursor,
  })
}

/** Satellite of the open report — other pending claims on the same catalog SKU. */
export async function listRelatedBrandCorrectionsAction(
  productId: number
): Promise<CorrectionReviewsPage['rows']> {
  if (!Number.isFinite(productId) || productId <= 0) return []
  const page = await getBrandPendingCorrectionsPage({
    limit: 25,
    productId,
  })
  return page.rows
}
