export type Product = {
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

export type L3Row = {
  l3_name: string
  taxonomy_node_id: number
  total_products: number
  products_battled: number
  total_battles: number
  top_elo: number | null
  avg_win_rate: number | null
}

export type SortKey = 'elo' | 'win_rate' | 'battles'

export function rankCategoryProducts(products: Product[], sort: SortKey) {
  return [...products]
    .sort((a, b) => {
      if (sort === 'elo') return Number(b.elo_score ?? 0) - Number(a.elo_score ?? 0)
      if (sort === 'win_rate') return Number(b.win_rate_pct ?? 0) - Number(a.win_rate_pct ?? 0)
      return b.battles_total - a.battles_total
    })
    .map((p, i) => ({ ...p, displayRank: i + 1 }))
}
