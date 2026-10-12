import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { AdminProductSearchResult } from '@/lib/queries'
import BoxProductSearchSlot from '../../BoxProductSearchSlot'
import BoxProductSuggestions from '../BoxProductSuggestions'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    rpc: async () => ({ data: [], error: null }),
  }),
}))

function product(
  partial: Partial<AdminProductSearchResult> = {},
): AdminProductSearchResult {
  return {
    product_id: 42,
    product_name_clean: 'Midnight Cocoa',
    brand_name: 'Odwalla',
    brand_id: 1,
    l2_name: null,
    l3_name: 'Chocolate',
    battles_total: 0,
    win_rate_pct: null,
    elo_score: null,
    milestone: '',
    image_url: null,
    taxonomy_node_id: null,
    l2_node_id: null,
    l1_name: null,
    ...partial,
  }
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('BoxProductSearchSlot', () => {
  it('opens on name search with the mode toggle', () => {
    const markup = renderToStaticMarkup(
      createElement(BoxProductSearchSlot, {
        taken: new Set<string>(),
        onPick: () => {},
      }),
    )

    expect(markup).toContain('role="tablist"')
    expect(markup).toContain('aria-label="Search by name or barcode"')
    expect(markup).toContain('aria-selected="true"')
    expect(markup).toContain('>Name<')
    expect(markup).toContain('>Barcode<')
    expect(markup).toContain('role="combobox"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('placeholder="Search by name or brand…"')
    expect(markup).not.toContain('role="listbox"')
    expect(markup).not.toContain('Enter the barcode on the package')
  })

  it('uses the caller placeholder when entry modes are off', () => {
    const markup = renderToStaticMarkup(
      createElement(BoxProductSearchSlot, {
        taken: new Set<string>(),
        onPick: () => {},
        entryModes: false,
        placeholder: 'Search competitors by name, brand, or barcode…',
      }),
    )

    expect(markup).not.toContain('role="tablist"')
    expect(markup).toContain('placeholder="Search competitors by name, brand, or barcode…"')
    expect(markup).not.toContain('placeholder="Search by name or brand…"')
  })
})

describe('BoxProductSuggestions', () => {
  const base = {
    showDropdown: true,
    listId: 'box-search',
    activeIndex: 0,
    onActiveIndex: () => {},
    onSelect: () => {},
    onRetry: () => {},
    taken: new Set<string>(),
  }

  it('asks for the rest of a short barcode', () => {
    const one = renderToStaticMarkup(
      createElement(BoxProductSuggestions, {
        ...base,
        status: 'empty',
        results: [],
        barcodeTooShort: true,
        barcodeQuery: true,
        digitsTyped: 1,
      }),
    )
    const many = renderToStaticMarkup(
      createElement(BoxProductSuggestions, {
        ...base,
        status: 'empty',
        results: [],
        barcodeTooShort: true,
        barcodeQuery: true,
        digitsTyped: 3,
      }),
    )

    expect(one).toContain('Keep typing the full barcode (8–14 digits).')
    expect(one).toContain('1 digit so far.')
    expect(many).toContain('3 digits so far.')
    expect(one).not.toContain('No product matches that barcode.')
  })

  it('distinguishes a finished barcode miss from a name miss and a lookup error', () => {
    const barcode = renderToStaticMarkup(
      createElement(BoxProductSuggestions, {
        ...base,
        status: 'empty',
        results: [],
        barcodeTooShort: false,
        barcodeQuery: true,
        digitsTyped: 12,
      }),
    )
    const name = renderToStaticMarkup(
      createElement(BoxProductSuggestions, {
        ...base,
        status: 'empty',
        results: [],
        barcodeTooShort: false,
        barcodeQuery: false,
        digitsTyped: 0,
      }),
    )
    const error = renderToStaticMarkup(
      createElement(BoxProductSuggestions, {
        ...base,
        status: 'error',
        results: [],
        barcodeTooShort: false,
        barcodeQuery: true,
        digitsTyped: 12,
      }),
    )

    expectOrder(barcode, [
      'No product matches that barcode.',
      'Check the digits against the package, or switch to Name.',
    ])
    expect(name).toContain('No products match — try a different name.')
    expect(name).not.toContain('Check the digits against the package')
    expect(error).toContain('Barcode lookup failed — tap to retry')
  })

  it('marks a taken product and shows a category beside the brand', () => {
    const markup = renderToStaticMarkup(
      createElement(BoxProductSuggestions, {
        ...base,
        status: 'success',
        results: [
          product({ image_url: 'https://example.com/cocoa.png' }),
          product({
            product_id: 7,
            product_name_clean: 'Plain Bar',
            brand_name: 'Other',
            l3_name: null,
            image_url: null,
          }),
        ],
        taken: new Set(['42']),
        barcodeTooShort: false,
        barcodeQuery: false,
        digitsTyped: 0,
      }),
    )

    expect(markup).toContain('id="box-search-opt-42"')
    expect(markup).toContain('aria-disabled="true"')
    expect(markup).toContain('src="https://example.com/cocoa.png"')
    expectOrder(markup, [
      'Midnight Cocoa',
      'Odwalla',
      'Chocolate',
      'already in box',
      'Plain Bar',
      'Other',
    ])
    expect(markup).not.toContain('Other ·')
  })
})
