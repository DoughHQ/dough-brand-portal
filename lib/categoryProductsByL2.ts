import { rpcErrorFields, type RpcErrorFields } from '@/lib/adjacentCategories'

/**
 * One brand product in an L2, as returned by get_brand_category_products_by_l2.
 * battles_ledger is the only comparison count that is always safe to show.
 * elo_score / win_rate_pct / user_percentile are n=1 today — strip before UI
 * unless SHOW_POPULATION_ELO is on.
 */
export type BrandCategoryProductRow = {
  product_id: number
  product_name_clean: string
  image_url: string | null
  l3_node_id: number | null
  l3_name: string | null
  battles_ledger: number
  elo_score: number | null
  win_rate_pct: number | null
  user_percentile: number | null
}

export type LockedCategoryProduct = {
  product_id: number
  product_name_clean: string
  image_url: string | null
  l3_name: string | null
  battles_ledger: number
  /** Present only when SHOW_POPULATION_ELO is on. Never send n=1 scores by default. */
  populationElo?: {
    eloScore: number | null
    winRatePct: number | null
    userPercentile: number | null
  }
}

export type CategoryProductSummary = {
  products: number
  withComparisons: number
  totalComparisons: number
}

export type CategoryProductsResult =
  | { ok: true; rows: BrandCategoryProductRow[]; allRowsUnparsed?: number }
  | { ok: false; rows: []; error: RpcErrorFields }

export type LockedCategoryCta = {
  kind: 'unlock' | 'activate' | 'talk'
  label: string
  sub: string
  subject: string
}

function textOrNull(value: unknown): string | null {
  if (value == null || value === '') return null
  const s = String(value).trim()
  return s ? s : null
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function asProduct(raw: unknown): BrandCategoryProductRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const productId = Number(o.product_id)
  if (!Number.isFinite(productId) || productId <= 0) return null
  const id = Math.trunc(productId)
  const l3Id = finiteNumber(o.l3_node_id)
  return {
    product_id: id,
    product_name_clean: textOrNull(o.product_name_clean) ?? `Product ${id}`,
    image_url: textOrNull(o.image_url),
    l3_node_id: l3Id != null && l3Id > 0 ? Math.trunc(l3Id) : null,
    l3_name: textOrNull(o.l3_name),
    battles_ledger: Math.max(0, Math.trunc(Number(o.battles_ledger) || 0)),
    elo_score: finiteNumber(o.elo_score),
    win_rate_pct: finiteNumber(o.win_rate_pct),
    user_percentile: finiteNumber(o.user_percentile),
  }
}

function asRowArray(data: unknown): unknown[] | null {
  if (data == null) return []
  if (Array.isArray(data)) return data
  return null
}

const INVALID_ENVELOPE: RpcErrorFields = {
  code: 'invalid_envelope',
  message: 'unparseable category products payload',
  details: null,
  hint: null,
}

/**
 * Maps a supabase rpc (data, error) pair. Pure — no I/O.
 * Table-returning RPC: a JS array (including empty / null) is success.
 * A non-array payload is envelope failure. Invalid rows are skipped.
 */
export function toCategoryProductsResult(
  data: unknown,
  error: unknown
): CategoryProductsResult {
  if (error) {
    return { ok: false, rows: [], error: rpcErrorFields(error) }
  }
  const raw = asRowArray(data)
  if (raw == null) {
    return { ok: false, rows: [], error: INVALID_ENVELOPE }
  }
  const rows = raw.map(asProduct).filter((r): r is BrandCategoryProductRow => r != null)
  if (raw.length > 0 && rows.length === 0) {
    return { ok: true, rows: [], allRowsUnparsed: raw.length }
  }
  return { ok: true, rows }
}

export function parseBrandCategoryProductsByL2(data: unknown): BrandCategoryProductRow[] {
  return toCategoryProductsResult(data, null).rows
}

export function categoryProductSummary(
  rows: Pick<BrandCategoryProductRow, 'battles_ledger'>[]
): CategoryProductSummary {
  let withComparisons = 0
  let totalComparisons = 0
  for (const row of rows) {
    const n = Math.max(0, Math.trunc(row.battles_ledger) || 0)
    if (n > 0) withComparisons += 1
    totalComparisons += n
  }
  return { products: rows.length, withComparisons, totalComparisons }
}

export function formatLedgerComparisons(battlesLedger: number): string {
  const n = Math.max(0, Math.trunc(battlesLedger) || 0)
  if (n === 0) return 'No comparisons yet'
  return `${n.toLocaleString()} comparison${n === 1 ? '' : 's'}`
}

export function toLockedCategoryProducts(
  rows: BrandCategoryProductRow[],
  opts?: { showPopulationElo?: boolean }
): LockedCategoryProduct[] {
  const showElo = opts?.showPopulationElo === true
  return rows.map((row) => {
    const product: LockedCategoryProduct = {
      product_id: row.product_id,
      product_name_clean: row.product_name_clean,
      image_url: row.image_url,
      l3_name: row.l3_name,
      battles_ledger: row.battles_ledger,
    }
    if (showElo) {
      product.populationElo = {
        eloScore: row.elo_score,
        winRatePct: row.win_rate_pct,
        userPercentile: row.user_percentile,
      }
    }
    return product
  })
}

export function lockedCategoryCta(
  totalComparisons: number,
  categoryName: string
): LockedCategoryCta {
  const name = categoryName.trim() || 'this category'
  if (totalComparisons > 0) {
    return {
      kind: 'unlock',
      label: 'Unlock full dashboard',
      sub: 'See the full preference breakdown for this category.',
      subject: `Unlock full dashboard: ${name}`,
    }
  }
  return {
    kind: 'activate',
    label: 'Activate this category',
    sub: `Put your ${name} products in front of real tasters.`,
    subject: `Activate this category: ${name}`,
  }
}

/** Zero-product discovery state — no stats, soft contact. */
export function noProductsCategoryCopy(categoryName: string): {
  line: string
  sub: string
  cta: LockedCategoryCta
} {
  const name = categoryName.trim() || 'this category'
  return {
    line: `You don’t have products in ${name} yet.`,
    sub: 'When you do, your comparisons and category standing will show up here.',
    cta: {
      kind: 'talk',
      label: 'Talk to us about this category',
      sub: '',
      subject: `Talk to us about this category: ${name}`,
    },
  }
}
