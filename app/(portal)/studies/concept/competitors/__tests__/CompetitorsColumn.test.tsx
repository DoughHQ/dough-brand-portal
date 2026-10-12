import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { newProductCompetitor } from '@/lib/concept/defaults'
import type { ProductCompetitorRow } from '@/lib/concept/types'
import CompetitorsColumn from '../../CompetitorsColumn'
import CompetitorSearchSlot from '../CompetitorSearchSlot'
import { PRODUCT_NAME } from '@/lib/brand'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    rpc: vi.fn(),
  }),
}))

function competitor(overrides: Partial<ProductCompetitorRow> = {}): ProductCompetitorRow {
  return {
    ...newProductCompetitor(),
    localId: 'comp-1',
    product_id: 8,
    frozen_display_name: 'Shelf Cola',
    frozen_brand_name: 'Other',
    upc: '012345678905',
    identityConfirmed: true,
    frozen_price: '4.99',
    ...overrides,
  }
}

function column(
  products: ProductCompetitorRow[],
  extras: Partial<Parameters<typeof CompetitorsColumn>[0]> = {}
) {
  return renderToStaticMarkup(
    createElement(CompetitorsColumn, {
      products,
      onProductsChange: () => {},
      priceMode: false,
      hidePrice: false,
      pricePosture: 'realistic',
      addCompetitor: { allowed: true },
      progressLabel: '1 competitor added',
      ...extras,
    })
  )
}

describe('CompetitorsColumn', () => {
  it('renders the empty competitive set', () => {
    const markup = column([], { progressLabel: 'Add at least one competitor' })

    expect(markup).toContain('Competitors')
    expect(markup).toContain('Add the real products shoppers would compare yours against.')
    expect(markup).toContain('Add competitors')
    expect(markup).toContain(`Search ${PRODUCT_NAME}’s product database`)
    expect(markup).toContain('+ Add competitor')
    expect(markup).toContain('Add at least one competitor')
    expect(markup).not.toContain('field-seat-product-')
  })

  it('hides the counted progress line in a single-product test', () => {
    const markup = column([], {
      singleTestMode: true,
      progressLabel: '1 competitor added',
    })

    expect(markup).toContain('Competitive set')
    expect(markup).toContain('The products they face.')
    expect(markup).not.toContain('1 competitor added')
  })

  it('keeps a resolved competitor’s identity, price, and shelf price', () => {
    const markup = column([competitor({ market_reference_price: '3.49' })], {
      priceMode: true,
      rowErrors: { 'comp-1': 'Duplicate UPC' },
    })

    expect(markup).toContain('id="field-seat-product-comp-1"')
    expect(markup).toContain('Shelf Cola')
    expect(markup).toContain('Other')
    expect(markup).toContain('UPC 012345678905')
    expect(markup).toContain('aria-label="Price for Shelf Cola"')
    expect(markup).toContain('value="4.99"')
    expect(markup).toContain('id="shelf-price-comp-1"')
    expect(markup).toContain('value="3.49"')
    expect(markup).toContain('Never shown to respondents.')
    expect(markup).toContain('Duplicate UPC')
    expect(markup).toContain('aria-label="Change Shelf Cola"')
    expect(markup).toContain('aria-label="Remove Shelf Cola"')
  })

  it('drops the offer price when the study is blind', () => {
    const markup = column([competitor()], { hidePrice: true, priceMode: false })

    expect(markup).not.toContain('aria-label="Price for Shelf Cola"')
    expect(markup).not.toContain('Shelf price')
  })

  it('renders the transient search slot as an add, not a saved seat', () => {
    const markup = renderToStaticMarkup(
      createElement(CompetitorSearchSlot, {
        isReplace: false,
        taken: new Set(['8']),
        onPick: () => {},
        onCancel: () => {},
      })
    )

    expect(markup).toContain('Add competitor')
    expect(markup).toContain('Search products')
    expect(markup).toContain('role="combobox"')
    expect(markup).toContain('Search by product or brand…')
    expect(markup).toContain('Cancel')
    expect(markup).not.toContain('field-seat-product-')
  })
})
