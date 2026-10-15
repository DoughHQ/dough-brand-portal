export type Period = '7d' | '30d' | '90d' | 'all'

export type CategoryStat = {
  l1_name: string
  l2_name: string
  l3_name: string
  taxonomy_node_id: number
  total_products: number
  products_with_battles: number
  total_battles: number
  total_wins: number
  win_rate_pct: number | null
  top_elo: number | null
  avg_elo: number | null
  top_product_name: string | null
  top_product_id: number | null
}

export type CategoryProduct = {
  product_id: number
  product_name_clean: string
  elo_score: number | null
  battles_total: number
  win_rate_pct: number | null
  user_percentile: number | null
  image_url: string | null
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return Math.round(n).toLocaleString()
}
export function pct(n: number | null | undefined): string {
  if (n == null) return '—'
  return Math.round(n * 100) + '%'
}
export function delta(n: number | null | undefined): string {
  if (n == null) return '—'
  const r = Math.round(n)
  return r > 0 ? `+${r}` : `${r}`
}
