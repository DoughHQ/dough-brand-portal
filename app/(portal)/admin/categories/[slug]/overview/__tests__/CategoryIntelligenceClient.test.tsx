import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import CategoryIntelligenceClient from '../../CategoryIntelligenceClient'
import { rankCategoryProducts, type Product } from '../categoryModel'

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
  l3_name: 'Bars',
  battles_total: 12,
  battles_won: 8,
  win_rate_pct: 60,
  elo_score: 1500,
  price_tier_label: 'Mid',
  image_url: null,
  rank: 1,
}

describe('category overview', () => {
  it('ranks by ELO and renders the leaderboard', () => {
    const low = { ...product, product_id: 2, elo_score: 900, product_name_clean: 'Cracker' }
    expect(rankCategoryProducts([low, product], 'elo').map((p) => p.displayRank)).toEqual([1, 2])
    const html = renderToStaticMarkup(
      <CategoryIntelligenceClient l2Name="Snacks" products={[product]} l3Breakdown={[]} />,
    )
    expect(html).toContain('Category intelligence')
    expect(html).toContain('← Products')
    expect(html).toContain('Oat Bar')
    expect(html).toContain('1 product')
    expect(html).not.toContain('Sub-categories')
  })

  it('shows the empty leaderboard copy', () => {
    const html = renderToStaticMarkup(
      <CategoryIntelligenceClient l2Name="Snacks" products={[]} l3Breakdown={[]} loadError="offline" />,
    )
    expect(html).toContain('Couldn’t load rankings: offline')
    expect(html).toContain('No data for this category yet')
    expect(html).toContain('When shoppers battle here')
  })
})
