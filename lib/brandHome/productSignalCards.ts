import { SHOW_POPULATION_ELO } from '@/lib/flags'
import {
  formatStandingRank,
  type ProductCategoryStandingRow,
} from '@/lib/brandHome/productCategoryStanding'

export const SIGNAL_CARD_LIMIT = 5

export type PortfolioProductRow = {
  product_id: number
  product_name_clean: string | null
  product_name_display: string | null
  image_url: string | null
  l2_name: string | null
  l3_name: string | null
  total_battles: number
  elo_score: number | null
  win_rate_pct: number | null
}

export type ProductSignalStanding = {
  unlocked: boolean
  /** Present only when has_standing is true and rank/pool are real integers. */
  rankLabel: string | null
  tooltip: string
}

export type ProductSignalCardModel = {
  productId: number
  name: string
  category: string | null
  imageUrl: string | null
  comparisonEvents: number
  href: string
  standing: ProductSignalStanding
  /** Omitted unless SHOW_POPULATION_ELO is on — never send n=1 scores to the client by default. */
  populationElo?: {
    eloScore: number | null
    winRatePct: number | null
  }
}

export function displayProductName(
  clean: string | null | undefined,
  display: string | null | undefined,
  productId: number
): string {
  const trimmedClean = clean?.trim()
  if (trimmedClean) return trimmedClean
  const trimmedDisplay = display?.trim()
  if (trimmedDisplay) return trimmedDisplay
  return `Product ${productId}`
}

/** Roles usable as a pack / hero shot on Home. Skip panels and back labels. */
const SIGNAL_IMAGE_ROLES = new Set(['front', 'lifestyle', 'side', 'other'])

export type ProductImageCandidate = {
  product_id: number
  public_url: string | null
  is_primary: boolean
  image_role: string | null
}

/**
 * Pick the best pack-shot URL for a product from product_images rows.
 * Prefer primary front, then any non-panel role (front / lifestyle / side / other).
 */
export function resolveSignalImageUrl(
  candidates: ProductImageCandidate[]
): string | null {
  const usable = candidates.filter((row) => {
    const url = row.public_url?.trim()
    if (!url) return false
    const role = (row.image_role ?? '').toLowerCase()
    return SIGNAL_IMAGE_ROLES.has(role)
  })
  if (usable.length === 0) return null

  const primaryFront = usable.find(
    (row) => row.is_primary && (row.image_role ?? '').toLowerCase() === 'front'
  )
  if (primaryFront?.public_url?.trim()) return primaryFront.public_url.trim()

  const anyPrimary = usable.find((row) => row.is_primary)
  if (anyPrimary?.public_url?.trim()) return anyPrimary.public_url.trim()

  const anyFront = usable.find((row) => (row.image_role ?? '').toLowerCase() === 'front')
  if (anyFront?.public_url?.trim()) return anyFront.public_url.trim()

  return usable[0]?.public_url?.trim() || null
}

/** Fill missing card imageUrl from a product_id → url map (portfolio wins when already set). */
export function applyResolvedImages(
  cards: ProductSignalCardModel[],
  byProductId: Map<number, string>
): ProductSignalCardModel[] {
  return cards.map((card) => {
    if (card.imageUrl) return card
    const hydrated = byProductId.get(card.productId)
    if (!hydrated) return card
    return { ...card, imageUrl: hydrated }
  })
}

function finiteNumber(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function standingRankLabel(
  standing: ProductCategoryStandingRow | undefined,
  category: string | null
): string | null {
  if (standing?.has_standing !== true) return null
  const rank = formatStandingRank(standing.rank_in_pool, standing.pool_size)
  if (!rank) return null
  return category ? `${rank} in ${category}` : rank
}

export function selectProductSignalCards(
  portfolio: PortfolioProductRow[],
  standingProducts: ProductCategoryStandingRow[],
  opts?: { showPopulationElo?: boolean; limit?: number }
): ProductSignalCardModel[] {
  const showElo = opts?.showPopulationElo ?? SHOW_POPULATION_ELO
  const limit = opts?.limit ?? SIGNAL_CARD_LIMIT
  const standingById = new Map(standingProducts.map((row) => [row.product_id, row]))

  return [...portfolio]
    .filter((row) => (Number(row.total_battles) || 0) > 0)
    .sort((a, b) => (Number(b.total_battles) || 0) - (Number(a.total_battles) || 0))
    .slice(0, Math.max(0, limit))
    .map((row) => {
      const productId = Number(row.product_id)
      const name = displayProductName(row.product_name_clean, row.product_name_display, productId)
      const category = row.l3_name?.trim() || row.l2_name?.trim() || null
      const standing = standingById.get(productId)
      const rankLabel = standingRankLabel(standing, category)
      const card: ProductSignalCardModel = {
        productId,
        name,
        category,
        imageUrl: row.image_url?.trim() || null,
        comparisonEvents: Math.max(0, Math.trunc(Number(row.total_battles) || 0)),
        href: `/products/${productId}`,
        standing: {
          unlocked: rankLabel != null,
          rankLabel,
          tooltip: `See where ${name} ranks among ${category ?? 'category'} tasters once enough people have compared it.`,
        },
      }
      if (showElo) {
        card.populationElo = {
          eloScore: finiteNumber(row.elo_score),
          winRatePct: finiteNumber(row.win_rate_pct),
        }
      }
      return card
    })
}
