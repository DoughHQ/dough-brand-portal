import type { CorrectionReviewRow } from '@/lib/corrections.shared'

export const REJECT_CHIPS = [
  'Wrong product',
  'Unreadable photo',
  'Spam / duplicate',
  'Not enough evidence',
  'Category is already correct',
  'Out of scope',
] as const

export function proposedApplyLabel(row: CorrectionReviewRow): string {
  const ct = (row.correction_type ?? '').toLowerCase()
  if (ct === 'category') return row.proposed_category_label ?? 'this category'
  if (ct === 'name') {
    return String((row.proposed_value as { name?: string } | null)?.name ?? 'this name')
  }
  if (ct === 'brand') {
    const v = row.proposed_value as { brand_name?: string; brand?: string } | null
    return String(v?.brand_name ?? v?.brand ?? 'this brand')
  }
  if (ct === 'product_image') return 'new photo'
  return 'this change'
}
