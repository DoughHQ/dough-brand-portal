import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Brand, PortalUser } from '@/lib/queries'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import { delta, fmt, pct } from '../dashboardFormat'
import DashboardClient from '../../DashboardClient'

vi.mock('../../../../../components/brandHome/brandHome.css', () => ({}))
vi.mock('@/components/brandHome/BrandHome', () => ({
  default: ({ profileSlot, totalBattles }: { profileSlot?: React.ReactNode; totalBattles?: number }) => (
    <section>
      battles {totalBattles}
      {profileSlot}
    </section>
  ),
}))
vi.mock('@/components/brandHome/BrandProfileCard', () => ({
  default: () => <div>Profile</div>,
}))
vi.mock('@/components/brandHome/ProductCategoryStandingCard', () => ({
  default: ({ catalogProductCount }: { catalogProductCount: number }) => (
    <div>Standing {catalogProductCount}</div>
  ),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ rpc: vi.fn() }),
}))

describe('dashboard format', () => {
  it('renders empty numbers as an em dash', () => {
    expect(fmt(null)).toBe('—')
    expect(pct(undefined)).toBe('—')
    expect(pct(0.55)).toBe('55%')
    expect(delta(null)).toBe('—')
    expect(delta(4)).toBe('+4')
    expect(delta(-2)).toBe('-2')
  })
})

describe('DashboardClient', () => {
  it('keeps the more-data panel and the empty SKU state', () => {
    const html = renderToStaticMarkup(
      <DashboardClient
        portalUser={{ role: 'brand_admin' } as unknown as PortalUser}
        brand={{ brand_id: 4, brand_name: 'Acme' } as unknown as Brand}
        subscription={null}
        snapshot={null}
        history={[]}
        productIntelligence={[]}
        competitive={null}
        allProducts={[]}
        narrative={{ headline: '', sub: '' }}
        homeModel={{} as unknown as BrandHomeModel}
        totalBattles={12}
      />,
    )
    expect(html).toContain('battles 12')
    expect(html).toContain('Profile')
    expect(html).toContain('More brand data')
    expect(html).toContain('All time')
    expect(html).toContain('Add SKU')
    expect(html).toContain('Standing 0')
    expect(html).toContain('Acme is in a competitive position.')
    expect(html).toContain('Occasion data populates after 50+ battles.')
    expect(html).toContain('Export CSV')
    expect(html).toContain('Claim your first SKU')
    expect(html).not.toContain('Unlock SKUs')
  })
})
