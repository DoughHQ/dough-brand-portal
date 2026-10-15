import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import L3IntelligenceClient from '../../L3IntelligenceClient'
import { rankProducts, relativeTime, type Product } from '../l3Model'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/lib/portal/useEnterImpersonation', () => ({
  useEnterImpersonation: () => ({ enterAsBrand: vi.fn(), loading: false }),
}))

const product: Product = {
  product_id: 9,
  product_name_clean: 'Oat Bar',
  brand_id: 3,
  brand_name: 'Acme',
  has_portal_access: false,
  battles_total: 12,
  battles_won: 8,
  win_rate_pct: 67,
  elo_score: 1510,
  price_tier_label: 'Mid',
  image_url: null,
  last_battle_at: null,
  is_statistically_meaningful: true,
  insight_tag: 'reach_out',
}

describe('l3 rankings', () => {
  it('sorts by ELO and leaves a missing battle time unlabeled', () => {
    const low = { ...product, product_id: 2, elo_score: 900, insight_tag: 'early_data' }
    expect(rankProducts([low, product], 'all', 'elo').map((p) => p.product_id)).toEqual([9, 2])
    expect(rankProducts([low, product], 'reach_out', 'battles')).toEqual([product])
    expect(relativeTime(null)).toBe('No recent activity')
  })

  it('renders the category masthead, insight, and ranking row', () => {
    const html = renderToStaticMarkup(
      <L3IntelligenceClient l2Name="Snacks" l3Name="Bars" products={[product]} />,
    )
    expect(html).toContain('L3 Category intelligence')
    expect(html).toContain('Bars')
    expect(html).toContain('Snacks · Ranked by declared consumer preference')
    expect(html).toContain('Reach out now · 1')
    expect(html).toContain('Oat Bar')
    expect(html).toContain('1 product')
    expect(html).toContain('>ELO<')
  })
})
