import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Brand } from '@/lib/queries'
import type { BrandProductPageItem } from '@/lib/brandHome/parseBrandProductPage'
import ProductsClient from '../../ProductsClient'

vi.mock('../../productsPage.css', () => ({}))
vi.mock('../../../../../components/categories/categoriesPage.css', () => ({}))
vi.mock('../../../../../components/products/productTile.css', () => ({}))
vi.mock('../../../../../components/products/productFacets.css', () => ({}))
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ rpc: vi.fn() }),
}))

const brand = {
  brand_name: 'Acme',
  brand_name_display: 'Acme Foods',
} as unknown as Brand

const item: BrandProductPageItem = {
  productId: 7,
  name: 'Oat Bar',
  imageUrl: null,
  category: 'Bars',
  l2Name: 'Snacks',
  l3Name: 'Bars',
  totalBattles: 0,
  l2NodeId: 3,
  hasBattleData: false,
  isClaimed: true,
}

describe('ProductsClient', () => {
  it('renders the catalog summary, search, and load-more gate', () => {
    const html = renderToStaticMarkup(
      <ProductsClient
        brand={brand}
        summary={{
          brandId: 1,
          productCount: 2,
          battledCount: 1,
          categoryCount: 1,
          claimedSkuCount: 1,
          catalogRefreshedAt: null,
        }}
        initialItems={[item]}
        initialHasMore
        initialCursor={{ totalBattles: 0, productId: 7 }}
      />,
    )
    expect(html).toContain('Acme')
    expect(html).toContain('Search products…')
    expect(html).toContain('In your catalog')
    expect(html).toContain('1 in catalog still unclaimed')
    expect(html).toContain('Oat Bar')
    expect(html).toContain('No signal yet')
    expect(html).toContain('Manage product')
    expect(html).toContain('Load more')
  })

  it('hides load more when the page is complete', () => {
    const html = renderToStaticMarkup(
      <ProductsClient
        brand={brand}
        summary={null}
        initialItems={[]}
        initialHasMore={false}
        initialCursor={null}
      />,
    )
    expect(html).toContain('No products in this catalog yet.')
    expect(html).not.toContain('Load more')
  })
})
