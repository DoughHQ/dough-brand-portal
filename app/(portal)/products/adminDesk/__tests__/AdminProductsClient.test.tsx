import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CategoryStat, MilestoneAlert, PortalUser } from '@/lib/queries'
import AdminProductsClient from '../../AdminProductsClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ rpc: vi.fn() }),
}))
vi.mock('@/lib/portal/useEnterImpersonation', () => ({
  useEnterImpersonation: () => ({ enterAsBrand: vi.fn(), loading: false }),
}))

const category = {
  l1_name: 'Food',
  l2_name: 'Snacks',
  total_products: 4,
  products_with_battles: 3,
  total_battles: 20,
  brands_represented: 2,
  top_elo: 1400,
  avg_elo: 1200,
  battle_density_pct: 12.5,
} satisfies CategoryStat

describe('AdminProductsClient', () => {
  it('renders the search desk, an empty heat map, and a milestone', () => {
    const html = renderToStaticMarkup(
      <AdminProductsClient
        portalUser={{} as PortalUser}
        categoryStats={[]}
        milestoneAlerts={[]}
        statsLagHint="Stats lag a few hours."
      />,
    )
    expect(html).toContain('Search products or brands...')
    expect(html).toContain('Stats lag a few hours.')
    expect(html).toContain('No battle data yet.')
    expect(html).toContain('No new milestones.')
  })

  it('renders a category row', () => {
    const html = renderToStaticMarkup(
      <AdminProductsClient
        portalUser={{} as PortalUser}
        categoryStats={[category]}
        milestoneAlerts={[
          {
            alert_id: 1,
            product_id: 9,
            brand_id: 3,
            milestone_type: '10_battles',
            battles_at_trigger: 10,
            win_rate_at_trigger: 60,
            elo_at_trigger: null,
            products: { product_name_clean: 'Oat Bar' },
            brands: { brand_name: 'Acme' },
          } as unknown as MilestoneAlert,
        ]}
      />,
    )
    expect(html).toContain('Snacks')
    expect(html).toContain('12.5%')
    expect(html).toContain('Oat Bar')
    expect(html).toContain('10 battles')
    expect(html).toContain('60% win rate')
  })
})
