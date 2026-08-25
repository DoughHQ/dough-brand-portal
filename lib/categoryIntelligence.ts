/** Dedupe per-user Elo rows into one ranked row per product. */
export type CategoryProductRow = {
  product_id: number
  product_name_clean: string
  brand_id: number
  brand_name: string
  l3_name: string | null
  battles_total: number
  battles_won: number
  win_rate_pct: number | null
  elo_score: number | null
  price_tier_label: string | null
  image_url: string | null
  rank: number
}

/** URL / kebab form of an L2 display name — e.g. "Juices & Smoothies" → "juices-and-smoothies". */
export function slugifyCategoryName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Alternate slugs so both "juices-and-smoothies" and "juices-smoothies" resolve. */
export function categorySlugVariants(name: string): string[] {
  const withAnd = slugifyCategoryName(name)
  const compact = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return [...new Set([withAnd, compact].filter(Boolean))]
}

/**
 * Resolve a route [slug] (display name or kebab slug) to a real L2 node_name_display.
 * Prefer exact match, then case-insensitive, then slugified equality.
 */
export function matchL2DisplayName(names: string[], rawSlug: string): string | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(rawSlug).trim()
    } catch {
      return rawSlug.trim()
    }
  })()
  if (!decoded) return null

  const exact = names.find((n) => n === decoded)
  if (exact) return exact

  const lower = decoded.toLowerCase()
  const ci = names.find((n) => n.toLowerCase() === lower)
  if (ci) return ci

  const targets = new Set(categorySlugVariants(decoded))
  if (targets.size === 0) return null
  return names.find((n) => categorySlugVariants(n).some((v) => targets.has(v))) ?? null
}

/** Only real PostgREST failures — empty `{}` / null-ish errors are not errors. */
export function isRealRpcError(
  error: unknown
): error is { message: string; code?: string; details?: string; hint?: string } {
  if (!error || typeof error !== 'object') return false
  const msg = (error as { message?: unknown }).message
  return typeof msg === 'string' && msg.trim().length > 0
}

export function logRpcError(
  label: string,
  error: { message: string; code?: string; details?: string; hint?: string }
) {
  console.error(label, {
    message: error.message,
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  })
}

export function aggregateCategoryProducts(
  rows: Array<{
    product_id: number
    product_name_clean: string
    brand_id: number
    brand_name: string
    l3_name?: string | null
    battles_total: number
    battles_won: number
    win_rate_pct?: number | null
    elo_score: number | null
    price_tier_label?: string | null
    image_url?: string | null
  }>
): CategoryProductRow[] {
  type Acc = {
    product_id: number
    product_name_clean: string
    brand_id: number
    brand_name: string
    l3_name: string | null
    battles_total: number
    battles_won: number
    elo_weight: number
    elo_sum: number
    price_tier_label: string | null
    image_url: string | null
  }

  const byId = new Map<number, Acc>()

  for (const r of rows) {
    const battles = Number(r.battles_total) || 0
    const wins = Number(r.battles_won) || 0
    const elo = r.elo_score != null ? Number(r.elo_score) : null
    const existing = byId.get(r.product_id)
    if (!existing) {
      byId.set(r.product_id, {
        product_id: r.product_id,
        product_name_clean: r.product_name_clean,
        brand_id: r.brand_id,
        brand_name: r.brand_name,
        l3_name: r.l3_name ?? null,
        battles_total: battles,
        battles_won: wins,
        elo_weight: elo != null && battles > 0 ? battles : elo != null ? 1 : 0,
        elo_sum: elo != null ? elo * (battles > 0 ? battles : 1) : 0,
        price_tier_label: r.price_tier_label ?? null,
        image_url: r.image_url ?? null,
      })
      continue
    }
    existing.battles_total += battles
    existing.battles_won += wins
    if (elo != null) {
      const w = battles > 0 ? battles : 1
      existing.elo_sum += elo * w
      existing.elo_weight += w
    }
  }

  const products = Array.from(byId.values())
    .map((a) => {
      const elo =
        a.elo_weight > 0 ? Math.round(a.elo_sum / a.elo_weight) : null
      const win_rate_pct =
        a.battles_total > 0
          ? Math.round((a.battles_won / a.battles_total) * 1000) / 10
          : null
      return {
        product_id: a.product_id,
        product_name_clean: a.product_name_clean,
        brand_id: a.brand_id,
        brand_name: a.brand_name,
        l3_name: a.l3_name,
        battles_total: a.battles_total,
        battles_won: a.battles_won,
        win_rate_pct,
        elo_score: elo,
        price_tier_label: a.price_tier_label,
        image_url: a.image_url,
        rank: 0,
      }
    })
    .sort((a, b) => Number(b.elo_score ?? 0) - Number(a.elo_score ?? 0))

  return products.map((p, i) => ({ ...p, rank: i + 1 }))
}
