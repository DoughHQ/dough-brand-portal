export type Report = {
  report_catalog_id: number
  report_type: string
  title: string
  description: string | null
  taxonomy_node_id: number | null
  taxonomy_level: string | null
  time_window_days: number
  min_battles: number
  verified_only: boolean
  price_cents: number
  category_name: string | null
}

export type Purchase = {
  report_catalog_id: number
}

export const REPORT_TYPE_LABELS: Record<string, string> = {
  category_ranking: 'Category Rankings',
  health_benchmark: 'Health Benchmarks',
  brand_scorecard: 'Brand Scorecard',
  competitive_set: 'Competitive Set',
}
