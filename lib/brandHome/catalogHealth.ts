import {
  hasUsablePackShot,
  type ProductImageCandidate,
} from '@/lib/brandHome/productSignalCards'

export type CatalogHealthMetric = {
  have: number
  total: number
}

export type CatalogHealth = {
  total: number
  categories: CatalogHealthMetric
  images: CatalogHealthMetric
  pricing: CatalogHealthMetric
  labelAllergen: CatalogHealthMetric
}

export type CatalogHealthProduct = {
  productId: number
  taxonomyNodeId: number | null
  imageUrl: string | null
  canonicalPricePerOz: number | null
}

export type CatalogHealthRowKey = 'categories' | 'images' | 'pricing' | 'labelAllergen'

export type CatalogHealthRow = {
  key: CatalogHealthRowKey
  label: string
  have: number
  total: number
  complete: boolean
}

const ROW_LABELS: { key: CatalogHealthRowKey; label: string }[] = [
  { key: 'categories', label: 'Categories' },
  { key: 'images', label: 'Product images' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'labelAllergen', label: 'Label & allergen data' },
]

function metric(have: number, total: number): CatalogHealthMetric {
  const t = Math.max(0, Math.trunc(total))
  const h = Math.min(t, Math.max(0, Math.trunc(have)))
  return { have: h, total: t }
}

export function selectCatalogHealth(
  products: CatalogHealthProduct[],
  imagesByProduct: Map<number, ProductImageCandidate[]>,
  confidentAllergenProductIds: Set<number>
): CatalogHealth {
  const total = products.length
  let categorized = 0
  let withImage = 0
  let withPrice = 0
  let withAllergen = 0

  for (const p of products) {
    if (p.taxonomyNodeId != null) categorized += 1
    if (hasUsablePackShot(p.imageUrl, imagesByProduct.get(p.productId) ?? [])) withImage += 1
    if (p.canonicalPricePerOz != null && Number.isFinite(p.canonicalPricePerOz)) withPrice += 1
    if (confidentAllergenProductIds.has(p.productId)) withAllergen += 1
  }

  return {
    total,
    categories: metric(categorized, total),
    images: metric(withImage, total),
    pricing: metric(withPrice, total),
    labelAllergen: metric(withAllergen, total),
  }
}

export function catalogHealthRows(health: CatalogHealth): CatalogHealthRow[] {
  return ROW_LABELS.map(({ key, label }) => {
    const { have, total } = health[key]
    return { key, label, have, total, complete: total > 0 && have >= total }
  })
}
