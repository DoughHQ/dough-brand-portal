import { createClient } from '@/lib/supabase'

export type StandingConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT'

export type ProductCategoryStandingRow = {
  product_id: number
  product_name: string
  taxonomy_node_id: number | null
  has_standing: boolean
  insufficient_reason: 'no_score' | 'too_few_battles' | 'no_pool' | null
  taste_elo_score: number | null
  battles: number
  rank_in_pool: number | null
  pool_size: number | null
  stderr: number | null
  confidence: StandingConfidence | null
}

export type BrandProductCategoryStanding = {
  brand_id: number | null
  has_any_standing: boolean
  headline: ProductCategoryStandingRow | null
  products: ProductCategoryStandingRow[]
  min_battles_floor: number
}

export class ProductStandingError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ProductStandingError'
    this.code = code
  }
}

/** English ordinal suffix — only call with a real integer rank. */
export function ordinalSuffix(n: number): string {
  const abs = Math.abs(Math.trunc(n))
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  switch (abs % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

export function formatOrdinal(n: number): string {
  return `${Math.trunc(n)}${ordinalSuffix(n)}`
}

/** e.g. "4th of 40" — only when both integers are present. */
export function formatStandingRank(
  rank: number | null | undefined,
  pool: number | null | undefined
): string | null {
  if (rank == null || pool == null) return null
  if (!Number.isFinite(rank) || !Number.isFinite(pool)) return null
  if (pool < 1) return null
  return `${formatOrdinal(rank)} of ${Math.trunc(pool)}`
}

export function insufficientReasonLabel(
  reason: ProductCategoryStandingRow['insufficient_reason']
): string {
  switch (reason) {
    case 'no_score':
    case 'too_few_battles':
    case 'no_pool':
      return 'not enough comparisons yet'
    default:
      return 'not enough comparisons yet'
  }
}

function asProduct(raw: unknown): ProductCategoryStandingRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const productId = Number(o.product_id)
  if (!Number.isFinite(productId)) return null
  const hasStanding = Boolean(o.has_standing)
  const reasonRaw = o.insufficient_reason
  const insufficient_reason =
    reasonRaw === 'no_score' || reasonRaw === 'too_few_battles' || reasonRaw === 'no_pool'
      ? reasonRaw
      : null
  const confidenceRaw = o.confidence
  const confidence =
    confidenceRaw === 'HIGH' ||
    confidenceRaw === 'MEDIUM' ||
    confidenceRaw === 'LOW' ||
    confidenceRaw === 'INSUFFICIENT'
      ? confidenceRaw
      : null

  return {
    product_id: productId,
    product_name: String(o.product_name ?? `Product ${productId}`),
    taxonomy_node_id: o.taxonomy_node_id == null ? null : Number(o.taxonomy_node_id),
    has_standing: hasStanding,
    insufficient_reason: hasStanding ? null : insufficient_reason,
    taste_elo_score:
      !hasStanding || o.taste_elo_score == null ? null : Number(o.taste_elo_score),
    battles: Number(o.battles ?? 0) || 0,
    rank_in_pool:
      !hasStanding || o.rank_in_pool == null ? null : Number(o.rank_in_pool),
    pool_size: !hasStanding || o.pool_size == null ? null : Number(o.pool_size),
    stderr: o.stderr == null ? null : Number(o.stderr),
    confidence: hasStanding ? confidence : null,
  }
}

export function parseBrandProductCategoryStanding(data: unknown): BrandProductCategoryStanding {
  const empty: BrandProductCategoryStanding = {
    brand_id: null,
    has_any_standing: false,
    headline: null,
    products: [],
    min_battles_floor: 10,
  }
  if (!data || typeof data !== 'object') return empty
  const row = data as Record<string, unknown>
  const products = Array.isArray(row.products)
    ? row.products.map(asProduct).filter((p): p is ProductCategoryStandingRow => p != null)
    : []
  const headline = asProduct(row.headline)
  const hasAny = Boolean(row.has_any_standing) && products.some((p) => p.has_standing)

  return {
    brand_id: row.brand_id == null ? null : Number(row.brand_id),
    has_any_standing: hasAny,
    headline: hasAny ? headline : null,
    products,
    min_battles_floor: Number(row.min_battles_floor ?? 10) || 10,
  }
}

/**
 * Product/category standing for the session brand (impersonation-aware).
 * Do not pass p_brand_id from the portal.
 */
export async function getBrandProductCategoryStanding(): Promise<BrandProductCategoryStanding> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_brand_product_category_standing' as never)

  if (error) {
    const msg = error.message || ''
    if (/no_effective_brand/i.test(msg)) {
      throw new ProductStandingError(
        'no_effective_brand',
        'Your session doesn’t have an active brand workspace. Refresh and try again.'
      )
    }
    throw new ProductStandingError('standing_failed', 'Couldn’t load category standings.')
  }

  return parseBrandProductCategoryStanding(data)
}
