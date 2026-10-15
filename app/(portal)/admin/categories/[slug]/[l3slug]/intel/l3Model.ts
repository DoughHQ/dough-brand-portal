export type Product = {
  product_id: number
  product_name_clean: string
  brand_id: number
  brand_name: string
  has_portal_access: boolean
  battles_total: number
  battles_won: number
  win_rate_pct: number | null
  elo_score: number | null
  price_tier_label: string | null
  image_url: string | null
  last_battle_at: string | null
  is_statistically_meaningful: boolean
  insight_tag: string | null
}

export const INSIGHT_CONFIG: Record<string, { label: string; color: string; bg: string; description: string }> = {
  reach_out: {
    label: 'Reach out',
    color: 'var(--sage)',
    bg: 'var(--sage-pale)',
    description: '10+ battles · strong win rate · no portal access',
  },
  trending: {
    label: 'Trending',
    color: '#185FA5',
    bg: '#E6F1FB',
    description: 'Most battles in this category',
  },
  overrated: {
    label: 'Overrated',
    color: '#BA7517',
    bg: '#FAEEDA',
    description: 'High ELO but fewer than 5 battles — sample too small',
  },
  underrated: {
    label: 'Underrated',
    color: '#533AB7',
    bg: '#EEEDFE',
    description: 'Win rate suggests ELO should be higher',
  },
  early_data: {
    label: 'Early data',
    color: 'var(--ink-30)',
    bg: 'var(--surface-1)',
    description: 'Fewer than 5 battles — inconclusive',
  },
}

export type SortKey = 'elo' | 'win_rate' | 'battles'
export type FilterKey = 'all' | 'reach_out' | 'trending' | 'overrated' | 'underrated' | 'meaningful'

export function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'No recent activity'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function rankProducts(products: Product[], filter: FilterKey, sort: SortKey): Product[] {
  return products
    .filter(p => {
      if (filter === 'all') return true
      if (filter === 'meaningful') return p.is_statistically_meaningful
      return p.insight_tag === filter
    })
    .sort((a, b) => {
      if (sort === 'elo') return Number(b.elo_score ?? 0) - Number(a.elo_score ?? 0)
      if (sort === 'win_rate') return Number(b.win_rate_pct ?? 0) - Number(a.win_rate_pct ?? 0)
      return b.battles_total - a.battles_total
    })
}
