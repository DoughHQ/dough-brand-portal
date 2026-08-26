import { describe, expect, it } from 'vitest'
import {
  parseProductDetailTab,
  parseSelectedSkuId,
  PRODUCT_DETAIL_TABS,
  PRODUCT_DETAIL_TAB_LABELS,
} from '../../app/(portal)/products/[productId]/tabs/productDetailTabs'

describe('parseProductDetailTab', () => {
  it('defaults to overview', () => {
    expect(parseProductDetailTab(null)).toBe('overview')
    expect(parseProductDetailTab('')).toBe('overview')
    expect(parseProductDetailTab('boxes')).toBe('overview')
  })

  it('accepts every product-detail tab key', () => {
    for (const tab of PRODUCT_DETAIL_TABS) {
      expect(parseProductDetailTab(tab)).toBe(tab)
    }
  })

  it('labels the packages tab as SKUs without renaming the URL key', () => {
    expect(PRODUCT_DETAIL_TAB_LABELS.packages).toBe('SKUs')
    expect(parseProductDetailTab('packages')).toBe('packages')
  })
})

describe('parseSelectedSkuId', () => {
  it('defaults to the first listed SKU', () => {
    expect(parseSelectedSkuId(null, [10, 20])).toBe(10)
    expect(parseSelectedSkuId('nope', [10, 20])).toBe(10)
  })

  it('accepts a sku id that exists on the product', () => {
    expect(parseSelectedSkuId('20', [10, 20])).toBe(20)
  })

  it('returns null when there are no SKUs', () => {
    expect(parseSelectedSkuId('20', [])).toBe(null)
  })
})
