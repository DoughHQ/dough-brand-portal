import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BRAND_PHOTO_ACCEPT } from '@/lib/productMaster/brandPhoto'
import type { MasterCoverage, ProductMaster } from '@/lib/productMaster/types'
import type { ProductMasterWrites } from '../../tabs/useProductMasterWrites'
import { ProductCoverageNote } from '../ProductCoverageNote'
import { ProductImageFileInput } from '../ProductImageFileInput'
import { ProductMasterTabBody } from '../ProductMasterTabBody'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ rpc: vi.fn(), from: vi.fn() }),
}))

const coverage = {
  active_products: 200,
  with_image: 100,
  with_nutrition: 50,
  with_ingredients: 0,
  with_allergens: 0,
  with_micronutrients: 20,
  with_dietary_flags: 0,
  with_facets: 0,
  with_price: 0,
  with_any_battle: 0,
  as_of: '2026-10-14',
} as unknown as MasterCoverage

const tabProps = {
  master: {} as unknown as ProductMaster,
  writes: {} as unknown as ProductMasterWrites,
  canEdit: false,
  isAdmin: false,
  skuId: null,
  selectSku: () => {},
  selectedSku: null,
  pendingFields: new Set<string>(),
  studies: [],
  productId: 9,
  effectiveBrandId: 3,
  pcfAsk: undefined,
}

describe('product master pieces', () => {
  it('renders the catalog coverage note', () => {
    const html = renderToStaticMarkup(<ProductCoverageNote cov={coverage} />)
    const text = html.replaceAll('<!-- -->', '')
    expect(text).toContain('Across 200 active products: 25% have nutrition · 10% have micronutrients · 50% have an image · 0% have a price.')
    expect(text).toContain(' · as of 2026-10-14')
  })

  it('renders only the selected tab', () => {
    const activity = renderToStaticMarkup(<ProductMasterTabBody tab="activity" {...tabProps} />)
    expect(activity).toContain('Product history will live here.')
    expect(activity).not.toContain('pm-studies-tab')
    const studies = renderToStaticMarkup(<ProductMasterTabBody tab="studies" {...tabProps} />)
    expect(studies).toContain('pm-studies-tab')
    expect(studies).not.toContain('Product history will live here.')
  })

  it('keeps the hidden image picker contract', () => {
    const html = renderToStaticMarkup(
      <ProductImageFileInput uploading hasPrimaryImage={false} uploadImage={async () => undefined} />,
    )
    expect(html).toContain('id="pm-product-image-file"')
    expect(html).toContain('class="pm-hero-file"')
    expect(html).toContain(`accept="${BRAND_PHOTO_ACCEPT}"`)
    expect(html).toContain('disabled=""')
  })
})
