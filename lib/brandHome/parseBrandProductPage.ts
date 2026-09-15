export type BrandProductPageItem = {
  productId: number
  name: string
  imageUrl: string | null
  category: string | null
  l2Name: string | null
  l3Name: string | null
  totalBattles: number
  l2NodeId: number | null
  hasBattleData: boolean
  /** Server-resolved claim membership for this row — never hydrate claimed_product_ids[]. */
  isClaimed: boolean
}

export type BrandProductPageCursor = {
  totalBattles: number
  productId: number
}

export type BrandProductPage = {
  brandId: number
  items: BrandProductPageItem[]
  hasMore: boolean
  nextCursor: BrandProductPageCursor | null
}

export type BrandCatalogSummary = {
  brandId: number
  productCount: number
  battledCount: number
  categoryCount: number
  claimedSkuCount: number
  catalogRefreshedAt: string | null
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function asNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function parseItem(raw: unknown): BrandProductPageItem | null {
  const r = asRecord(raw)
  if (!r) return null
  const productId = asNum(r.product_id)
  if (!Number.isFinite(productId) || productId <= 0) return null
  const name = r.name == null ? `Product ${productId}` : String(r.name)
  return {
    productId,
    name,
    imageUrl: r.image_url == null ? null : String(r.image_url),
    category: r.category == null ? null : String(r.category),
    l2Name: r.l2_name == null ? null : String(r.l2_name),
    l3Name: r.l3_name == null ? null : String(r.l3_name),
    totalBattles: asNum(r.total_battles),
    l2NodeId: r.l2_node_id == null ? null : asNum(r.l2_node_id),
    hasBattleData: r.has_battle_data === true || asNum(r.total_battles) > 0,
    isClaimed: r.is_claimed === true,
  }
}

export function parseBrandProductPage(raw: unknown): BrandProductPage | null {
  const r = asRecord(raw)
  if (!r) return null
  const brandId = asNum(r.brand_id)
  if (!Number.isFinite(brandId) || brandId <= 0) return null
  const itemsRaw = Array.isArray(r.items) ? r.items : []
  const items: BrandProductPageItem[] = []
  for (const item of itemsRaw) {
    const parsed = parseItem(item)
    if (parsed) items.push(parsed)
  }
  const cursorRaw = asRecord(r.next_cursor)
  const nextCursor =
    cursorRaw && r.has_more === true
      ? {
          totalBattles: asNum(cursorRaw.total_battles),
          productId: asNum(cursorRaw.product_id),
        }
      : null
  return {
    brandId,
    items,
    hasMore: r.has_more === true && nextCursor != null,
    nextCursor,
  }
}
