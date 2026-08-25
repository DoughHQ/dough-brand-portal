import { describe, expect, it } from 'vitest'
import type { ProductCategoryStandingRow } from '../brandHome/productCategoryStanding'
import {
  applyResolvedImages,
  displayProductName,
  resolveSignalImageUrl,
  selectProductSignalCards,
  type PortfolioProductRow,
  type ProductSignalCardModel,
} from '../brandHome/productSignalCards'
import { SHOW_POPULATION_ELO } from '../flags'

function product(
  partial: Partial<PortfolioProductRow> & Pick<PortfolioProductRow, 'product_id'>
): PortfolioProductRow {
  return {
    product_name_clean: `Clean ${partial.product_id}`,
    product_name_display: `DISPLAY ${partial.product_id}`,
    image_url: null,
    l2_name: 'Sports Nutrition',
    l3_name: 'Sports Drinks',
    total_battles: 0,
    elo_score: 1136,
    win_rate_pct: 75,
    ...partial,
  }
}

function standing(
  partial: Partial<ProductCategoryStandingRow> & Pick<ProductCategoryStandingRow, 'product_id'>
): ProductCategoryStandingRow {
  return {
    product_name: `Product ${partial.product_id}`,
    taxonomy_node_id: 1,
    has_standing: false,
    insufficient_reason: 'too_few_battles',
    taste_elo_score: null,
    battles: 0,
    rank_in_pool: null,
    pool_size: null,
    stderr: null,
    confidence: null,
    ...partial,
  }
}

describe('displayProductName', () => {
  it('prefers product_name_clean over ALL CAPS display', () => {
    expect(displayProductName('Gatorade Lemon Lime', 'GATORADE LEMON LIME', 1)).toBe(
      'Gatorade Lemon Lime'
    )
  })

  it('falls back to display then a generic label', () => {
    expect(displayProductName(null, 'GATORADE', 9)).toBe('GATORADE')
    expect(displayProductName('  ', '  ', 9)).toBe('Product 9')
  })
})

describe('selectProductSignalCards', () => {
  it('keeps only products with total_battles > 0, sorted desc, max 5', () => {
    const cards = selectProductSignalCards(
      [
        product({ product_id: 1, total_battles: 3 }),
        product({ product_id: 2, total_battles: 0 }),
        product({ product_id: 3, total_battles: 40 }),
        product({ product_id: 4, total_battles: 12 }),
        product({ product_id: 5, total_battles: 8 }),
        product({ product_id: 6, total_battles: 1 }),
        product({ product_id: 7, total_battles: 20 }),
      ],
      []
    )
    expect(cards.map((c) => c.productId)).toEqual([3, 7, 4, 5, 1])
    expect(cards).toHaveLength(5)
  })

  it('returns empty when nothing has battles', () => {
    expect(selectProductSignalCards([product({ product_id: 1, total_battles: 0 })], [])).toEqual([])
  })

  it('uses Title Case clean names and l3 then l2 for category', () => {
    const [card] = selectProductSignalCards(
      [
        product({
          product_id: 10,
          total_battles: 4,
          product_name_clean: 'Gatorade Lemon Lime Thirst Quencher',
          product_name_display: 'GATORADE LEMON LIME THIRST QUENCHER',
          l3_name: 'Sports Drinks',
          l2_name: 'Sports Nutrition',
        }),
      ],
      []
    )
    expect(card.name).toBe('Gatorade Lemon Lime Thirst Quencher')
    expect(card.category).toBe('Sports Drinks')
    expect(card.href).toBe('/products/10')
    expect(card.comparisonEvents).toBe(4)
  })

  it('falls back to l2 when l3 is missing', () => {
    const [card] = selectProductSignalCards(
      [product({ product_id: 1, total_battles: 2, l3_name: null, l2_name: 'Sports Nutrition' })],
      []
    )
    expect(card.category).toBe('Sports Nutrition')
  })

  it('locks standing unless has_standing is true with a real rank and pool', () => {
    const [locked] = selectProductSignalCards(
      [product({ product_id: 1, total_battles: 24, product_name_clean: 'Gatorade Lemon Lime' })],
      [
        standing({
          product_id: 1,
          has_standing: false,
          rank_in_pool: 2,
          pool_size: 40,
        }),
      ]
    )
    expect(locked.standing.unlocked).toBe(false)
    expect(locked.standing.rankLabel).toBeNull()
    expect(locked.standing.tooltip).toBe(
      'See where Gatorade Lemon Lime ranks among Sports Drinks tasters once enough people have compared it.'
    )

    const [open] = selectProductSignalCards(
      [product({ product_id: 2, total_battles: 24, product_name_clean: 'Gatorade Frost' })],
      [
        standing({
          product_id: 2,
          has_standing: true,
          rank_in_pool: 4,
          pool_size: 40,
          insufficient_reason: null,
        }),
      ]
    )
    expect(open.standing.unlocked).toBe(true)
    expect(open.standing.rankLabel).toBe('4th of 40 in Sports Drinks')
  })

  it('does not unlock standing when rank/pool are missing even if has_standing is true', () => {
    const [card] = selectProductSignalCards(
      [product({ product_id: 1, total_battles: 4 })],
      [standing({ product_id: 1, has_standing: true, rank_in_pool: null, pool_size: 40 })]
    )
    expect(card.standing.unlocked).toBe(false)
    expect(card.standing.rankLabel).toBeNull()
  })

  it('omits ELO by default (flag off) and includes it only when asked', () => {
    expect(SHOW_POPULATION_ELO).toBe(false)
    const [hidden] = selectProductSignalCards(
      [product({ product_id: 1, total_battles: 4, elo_score: 1136, win_rate_pct: 75 })],
      []
    )
    expect(hidden.populationElo).toBeUndefined()

    const [shown] = selectProductSignalCards(
      [product({ product_id: 1, total_battles: 4, elo_score: 1136, win_rate_pct: 75 })],
      [],
      { showPopulationElo: true }
    )
    expect(shown.populationElo).toEqual({ eloScore: 1136, winRatePct: 75 })
  })
})

describe('resolveSignalImageUrl', () => {
  it('prefers primary front over other roles', () => {
    expect(
      resolveSignalImageUrl([
        {
          product_id: 1,
          public_url: 'https://cdn.example/lifestyle.jpg',
          is_primary: true,
          image_role: 'lifestyle',
        },
        {
          product_id: 1,
          public_url: 'https://cdn.example/front.jpg',
          is_primary: true,
          image_role: 'front',
        },
      ])
    ).toBe('https://cdn.example/front.jpg')
  })

  it('skips nutrition / ingredients / back panels', () => {
    expect(
      resolveSignalImageUrl([
        {
          product_id: 1,
          public_url: 'https://cdn.example/nutrition.jpg',
          is_primary: true,
          image_role: 'nutrition_panel',
        },
        {
          product_id: 1,
          public_url: 'https://cdn.example/back.jpg',
          is_primary: true,
          image_role: 'back',
        },
        {
          product_id: 1,
          public_url: 'https://cdn.example/side.jpg',
          is_primary: false,
          image_role: 'side',
        },
      ])
    ).toBe('https://cdn.example/side.jpg')
  })

  it('returns null when no usable pack shot exists', () => {
    expect(
      resolveSignalImageUrl([
        {
          product_id: 1,
          public_url: 'https://cdn.example/ingredients.jpg',
          is_primary: true,
          image_role: 'ingredients_panel',
        },
        {
          product_id: 1,
          public_url: null,
          is_primary: true,
          image_role: 'front',
        },
      ])
    ).toBeNull()
  })
})

describe('applyResolvedImages', () => {
  const baseCard = (partial: Partial<ProductSignalCardModel> & Pick<ProductSignalCardModel, 'productId'>): ProductSignalCardModel => ({
    name: `Product ${partial.productId}`,
    category: 'Sports Drinks',
    imageUrl: null,
    comparisonEvents: 4,
    href: `/products/${partial.productId}`,
    standing: {
      unlocked: false,
      rankLabel: null,
      tooltip: 'tip',
    },
    ...partial,
  })

  it('fills only missing imageUrl and leaves portfolio urls alone', () => {
    const cards = applyResolvedImages(
      [
        baseCard({ productId: 1, imageUrl: 'https://cdn.example/portfolio.jpg' }),
        baseCard({ productId: 2, imageUrl: null }),
        baseCard({ productId: 3, imageUrl: null }),
      ],
      new Map([
        [1, 'https://cdn.example/should-not-win.jpg'],
        [2, 'https://cdn.example/hydrated.jpg'],
      ])
    )
    expect(cards[0].imageUrl).toBe('https://cdn.example/portfolio.jpg')
    expect(cards[1].imageUrl).toBe('https://cdn.example/hydrated.jpg')
    expect(cards[2].imageUrl).toBeNull()
  })
})
