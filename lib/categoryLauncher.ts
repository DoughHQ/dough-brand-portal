import { createClient } from '@/lib/supabase'

export type CategoryLauncherRow = {
  l2_id: number
  l2_name: string
  l1_name: string | null
  banner_image_url: string | null
  icon_name: string | null
  total_products: number
  products_with_battles: number
  total_battles: number
  entitled: boolean
}

export type BrandCategoryLauncher = {
  owned: CategoryLauncherRow[]
  has_products: CategoryLauncherRow[]
  browse: CategoryLauncherRow[]
  search: string | null
}

export class CategoryLauncherError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'CategoryLauncherError'
    this.code = code
  }
}

/** Honest brand-scoped counts for "Where you compete". */
export function formatCompeteCounts(row: CategoryLauncherRow): string {
  const products = Math.max(0, Math.trunc(row.total_products))
  const withBattles = Math.max(0, Math.trunc(row.products_with_battles))
  const battles = Math.max(0, Math.trunc(row.total_battles))
  return `${products.toLocaleString()} product${products === 1 ? '' : 's'} · ${withBattles.toLocaleString()} with battles · ${battles.toLocaleString()} battles`
}

/** Categories the brand competes in (owned ∪ has_products). Owned wins on id conflict. */
export function competeCategoriesFromLauncher(
  launcher: BrandCategoryLauncher
): CategoryLauncherRow[] {
  const byId = new Map<number, CategoryLauncherRow>()
  for (const row of launcher.has_products) byId.set(row.l2_id, row)
  for (const row of launcher.owned) byId.set(row.l2_id, row)
  return [...byId.values()]
}

export function entitledL2IdsFromLauncher(launcher: BrandCategoryLauncher): number[] {
  const ids = new Set<number>()
  for (const row of [...launcher.owned, ...launcher.has_products]) {
    if (row.entitled) ids.add(row.l2_id)
  }
  return [...ids]
}

export function sumCompeteBattles(rows: CategoryLauncherRow[]): number {
  return rows.reduce((s, r) => s + (r.total_battles || 0), 0)
}

export function sumCompeteProductsWithBattles(rows: CategoryLauncherRow[]): number {
  return rows.reduce((s, r) => s + (r.products_with_battles || 0), 0)
}

/** Shape consumed by selectHomeModel / BrandCategoryL2. */
export function launcherRowsToBrandCategoryL2(rows: CategoryLauncherRow[]): {
  l2NodeId: number
  l2Name: string
  productCount: number
  battles: number
  productsWithBattles: number
  bannerImageUrl: string | null
}[] {
  return rows.map((r) => ({
    l2NodeId: r.l2_id,
    l2Name: r.l2_name,
    productCount: r.total_products,
    battles: r.total_battles,
    productsWithBattles: r.products_with_battles,
    bannerImageUrl: r.banner_image_url,
  }))
}

function asRow(raw: unknown): CategoryLauncherRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const l2Id = Number(o.l2_id)
  if (!Number.isFinite(l2Id) || l2Id <= 0) return null
  return {
    l2_id: Math.trunc(l2Id),
    l2_name: String(o.l2_name ?? `Category ${l2Id}`),
    l1_name: o.l1_name == null || o.l1_name === '' ? null : String(o.l1_name),
    banner_image_url:
      o.banner_image_url == null || o.banner_image_url === ''
        ? null
        : String(o.banner_image_url),
    icon_name: o.icon_name == null || o.icon_name === '' ? null : String(o.icon_name),
    total_products: Math.max(0, Math.trunc(Number(o.total_products) || 0)),
    products_with_battles: Math.max(0, Math.trunc(Number(o.products_with_battles) || 0)),
    total_battles: Math.max(0, Math.trunc(Number(o.total_battles) || 0)),
    entitled: Boolean(o.entitled),
  }
}

function asList(raw: unknown): CategoryLauncherRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map(asRow).filter((r): r is CategoryLauncherRow => r != null)
}

/** Drop duplicates across tiers — owned wins, then has_products, then browse. */
export function parseBrandCategoryLauncher(data: unknown): BrandCategoryLauncher {
  const empty: BrandCategoryLauncher = {
    owned: [],
    has_products: [],
    browse: [],
    search: null,
  }
  if (!data || typeof data !== 'object') return empty
  const row = data as Record<string, unknown>

  const owned = asList(row.owned)
  const ownedIds = new Set(owned.map((c) => c.l2_id))
  const hasProducts = asList(row.has_products).filter((c) => !ownedIds.has(c.l2_id))
  const hasIds = new Set([...ownedIds, ...hasProducts.map((c) => c.l2_id)])
  const browse = asList(row.browse).filter((c) => !hasIds.has(c.l2_id))

  const searchRaw = row.search
  const search =
    searchRaw == null || searchRaw === '' ? null : String(searchRaw)

  return { owned, has_products: hasProducts, browse, search }
}

/**
 * Category launcher for the session brand (impersonation-aware).
 * Do not pass p_brand_id from the portal.
 */
export async function getBrandCategoryLauncher(
  search?: string | null
): Promise<BrandCategoryLauncher> {
  const supabase = createClient()
  const trimmed = search?.trim() || ''
  const args = trimmed ? { p_search: trimmed } : {}
  const { data, error } = await supabase.rpc(
    'get_brand_category_launcher' as never,
    args as never
  )

  if (error) {
    const msg = error.message || ''
    if (/no_effective_brand/i.test(msg)) {
      throw new CategoryLauncherError(
        'no_effective_brand',
        'Your session doesn’t have an active brand workspace. Refresh and try again.'
      )
    }
    throw new CategoryLauncherError('launcher_failed', 'Couldn’t load categories.')
  }

  return parseBrandCategoryLauncher(data)
}
