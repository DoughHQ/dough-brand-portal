export type ProductResult = {
  product_id: number
  product_name_clean: string
  brand_name: string
  brand_id: number
  l2_name: string | null
  l3_name: string | null
  battles_total: number
  win_rate_pct: number | null
  elo_score: number | null
  milestone: string
}

export const milestoneLabel: Record<string, string> = {
  '10_battles': '10 battles',
  '25_battles': '25 battles',
  '50_battles': '50 battles',
  '100_battles': '100 battles',
  'first_battle': 'First battle',
}
