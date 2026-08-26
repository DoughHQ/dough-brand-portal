import { describe, expect, it } from 'vitest'
import {
  catalogHealthRows,
  selectCatalogHealth,
  type CatalogHealthProduct,
} from '../brandHome/catalogHealth'
import type { ProductImageCandidate } from '../brandHome/productSignalCards'

function product(
  partial: Partial<CatalogHealthProduct> & Pick<CatalogHealthProduct, 'productId'>
): CatalogHealthProduct {
  return {
    taxonomyNodeId: 1,
    imageUrl: null,
    canonicalPricePerOz: null,
    ...partial,
  }
}

function img(
  partial: Partial<ProductImageCandidate> & Pick<ProductImageCandidate, 'product_id'>
): ProductImageCandidate {
  return {
    public_url: 'https://cdn.example/front.jpg',
    is_primary: true,
    image_role: 'front',
    ...partial,
  }
}

describe('selectCatalogHealth', () => {
  it('uses product list length as the shared total', () => {
    const health = selectCatalogHealth(
      [product({ productId: 1 }), product({ productId: 2, taxonomyNodeId: null })],
      new Map(),
      new Set()
    )
    expect(health.total).toBe(2)
    expect(health.categories).toEqual({ have: 1, total: 2 })
    expect(health.images).toEqual({ have: 0, total: 2 })
    expect(health.pricing).toEqual({ have: 0, total: 2 })
    expect(health.labelAllergen).toEqual({ have: 0, total: 2 })
  })

  it('counts a pack shot from image_url or a usable product_images role, not panels', () => {
    const images = new Map<number, ProductImageCandidate[]>([
      [2, [img({ product_id: 2 })]],
      [3, [img({ product_id: 3, image_role: 'panel', public_url: 'https://cdn.example/panel.jpg' })]],
    ])
    const health = selectCatalogHealth(
      [
        product({ productId: 1, imageUrl: 'https://cdn.example/a.jpg' }),
        product({ productId: 2 }),
        product({ productId: 3 }),
      ],
      images,
      new Set()
    )
    expect(health.images).toEqual({ have: 2, total: 3 })
  })

  it('counts price and confident allergen rows only', () => {
    const health = selectCatalogHealth(
      [
        product({ productId: 1, canonicalPricePerOz: 0.12 }),
        product({ productId: 2, canonicalPricePerOz: null }),
      ],
      new Map(),
      new Set([1, 99])
    )
    expect(health.pricing).toEqual({ have: 1, total: 2 })
    expect(health.labelAllergen).toEqual({ have: 1, total: 2 })
  })
})

describe('catalogHealthRows', () => {
  it('marks complete only when have covers a non-zero total', () => {
    const rows = catalogHealthRows({
      total: 49,
      categories: { have: 49, total: 49 },
      images: { have: 1, total: 49 },
      pricing: { have: 0, total: 49 },
      labelAllergen: { have: 13, total: 49 },
    })
    expect(rows.map((r) => [r.label, `${r.have} / ${r.total}`, r.complete])).toEqual([
      ['Categories', '49 / 49', true],
      ['Product images', '1 / 49', false],
      ['Pricing', '0 / 49', false],
      ['Label & allergen data', '13 / 49', false],
    ])
  })
})
