import { describe, expect, it } from 'vitest'
import { splitCategoryPath } from '../../app/(portal)/products/[productId]/tabs/overviewPresentation'

describe('splitCategoryPath', () => {
  it('returns empty for missing paths', () => {
    expect(splitCategoryPath(null)).toEqual([])
    expect(splitCategoryPath('')).toEqual([])
    expect(splitCategoryPath('   ')).toEqual([])
  })

  it('splits a Dough category path on >', () => {
    expect(
      splitCategoryPath('All Products > Beverages > Juices & Smoothies > Smoothies (RTD)')
    ).toEqual(['All Products', 'Beverages', 'Juices & Smoothies', 'Smoothies (RTD)'])
  })

  it('keeps a single node as-is', () => {
    expect(splitCategoryPath('Smoothies (RTD)')).toEqual(['Smoothies (RTD)'])
  })
})
