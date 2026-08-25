import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SHOW_POPULATION_ELO } from '@/lib/flags'
import {
  parseBrandProductCategoryStanding,
  type BrandProductCategoryStanding,
} from '@/lib/brandHome/productCategoryStanding'
import {
  applyResolvedImages,
  resolveSignalImageUrl,
  selectProductSignalCards,
  type PortfolioProductRow,
  type ProductImageCandidate,
  type ProductSignalCardModel,
} from '@/lib/brandHome/productSignalCards'
import { timed } from '@/lib/perf'

function asPortfolioRow(raw: unknown): PortfolioProductRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const productId = Number(o.product_id)
  if (!Number.isFinite(productId)) return null
  return {
    product_id: productId,
    product_name_clean: o.product_name_clean == null ? null : String(o.product_name_clean),
    product_name_display: o.product_name_display == null ? null : String(o.product_name_display),
    image_url: o.image_url == null ? null : String(o.image_url),
    l2_name: o.l2_name == null ? null : String(o.l2_name),
    l3_name: o.l3_name == null ? null : String(o.l3_name),
    total_battles: Number(o.total_battles) || 0,
    elo_score: o.elo_score == null ? null : Number(o.elo_score),
    win_rate_pct: o.win_rate_pct == null ? null : Number(o.win_rate_pct),
  }
}

async function fetchPortfolio(brandId: number): Promise<PortfolioProductRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_brand_products_portfolio', {
    p_brand_id: brandId,
  })
  if (error) {
    console.error('[home] get_brand_products_portfolio', {
      message: error.message,
      code: error.code,
      brandId,
    })
    return []
  }
  return (data ?? []).map(asPortfolioRow).filter((row): row is PortfolioProductRow => row != null)
}

/**
 * Session-scoped standing (impersonation-aware). Do not pass p_brand_id.
 * Failures return empty standing so cards still render with a locked slot.
 */
async function fetchStanding(): Promise<BrandProductCategoryStanding> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_brand_product_category_standing' as never)
  if (error) {
    console.error('[home] get_brand_product_category_standing', {
      message: error.message,
      code: error.code,
    })
    return parseBrandProductCategoryStanding(null)
  }
  return parseBrandProductCategoryStanding(data)
}

/**
 * Hydrate missing portfolio image_url from product_images (authenticated SELECT).
 * Only queries ids still missing a URL after the top-N select.
 */
async function hydrateMissingImages(
  cards: ProductSignalCardModel[]
): Promise<ProductSignalCardModel[]> {
  const missingIds = cards.filter((c) => !c.imageUrl).map((c) => c.productId)
  if (missingIds.length === 0) return cards

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('product_images')
    .select('product_id, public_url, is_primary, image_role')
    .in('product_id', missingIds)
    .is('deleted_at', null)

  if (error) {
    console.error('[home] product_images hydrate', {
      message: error.message,
      code: error.code,
    })
    return cards
  }

  const byProduct = new Map<number, ProductImageCandidate[]>()
  for (const row of data ?? []) {
    const productId = Number(row.product_id)
    if (!Number.isFinite(productId)) continue
    const list = byProduct.get(productId) ?? []
    list.push({
      product_id: productId,
      public_url: row.public_url == null ? null : String(row.public_url),
      is_primary: Boolean(row.is_primary),
      image_role: row.image_role == null ? null : String(row.image_role),
    })
    byProduct.set(productId, list)
  }

  const urlById = new Map<number, string>()
  for (const [productId, candidates] of byProduct) {
    const url = resolveSignalImageUrl(candidates)
    if (url) urlById.set(productId, url)
  }

  return applyResolvedImages(cards, urlById)
}

/** Top battled products for Brand Home "Your products" — portfolio + standing, no new RPCs. */
export async function fetchProductSignalCards(brandId: number): Promise<ProductSignalCardModel[]> {
  return timed('fetchProductSignalCards', async () => {
    const [portfolio, standing] = await Promise.all([fetchPortfolio(brandId), fetchStanding()])
    const cards = selectProductSignalCards(portfolio, standing.products, {
      showPopulationElo: SHOW_POPULATION_ELO,
    })
    return hydrateMissingImages(cards)
  })
}
