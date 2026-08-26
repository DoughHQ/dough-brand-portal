export const PRODUCT_DETAIL_TABS = [
  'overview',
  'packages',
  'pricing',
  'nutrition',
  'intelligence',
  'studies',
  'proof',
  'images',
  'activity',
] as const

export type ProductDetailTab = (typeof PRODUCT_DETAIL_TABS)[number]

export const PRODUCT_DETAIL_TAB_LABELS: Record<ProductDetailTab, string> = {
  overview: 'Overview',
  packages: 'SKUs',
  pricing: 'Pricing',
  nutrition: 'Ingredients & nutrition',
  intelligence: 'Intelligence',
  studies: 'Studies',
  proof: 'Proof',
  images: 'Images',
  activity: 'Activity',
}

export function parseProductDetailTab(raw: string | null): ProductDetailTab {
  if (raw && (PRODUCT_DETAIL_TABS as readonly string[]).includes(raw)) {
    return raw as ProductDetailTab
  }
  return 'overview'
}

/** First listed SKU if `sku` is missing or not in the loaded set. */
export function parseSelectedSkuId(raw: string | null, skuIds: number[]): number | null {
  if (skuIds.length === 0) return null
  const parsed = raw != null && raw !== '' ? Number(raw) : NaN
  if (Number.isInteger(parsed) && skuIds.includes(parsed)) return parsed
  return skuIds[0]
}
