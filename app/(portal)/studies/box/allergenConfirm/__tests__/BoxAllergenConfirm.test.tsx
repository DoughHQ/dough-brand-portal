import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createEmptyBoxFieldRow } from '@/lib/box/defaults'
import type { BoxFieldRow } from '@/lib/box/types'
import BoxAllergenConfirm from '../../BoxAllergenConfirm'
import AllergenReview from '../AllergenReview'

function seat(overrides: Partial<BoxFieldRow> = {}): BoxFieldRow {
  return { ...createEmptyBoxFieldRow(), ...overrides }
}

function renderConfirm(row: BoxFieldRow) {
  return renderToStaticMarkup(
    createElement(BoxAllergenConfirm, { row, onChange: () => {} }),
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('BoxAllergenConfirm', () => {
  it('stays hidden until a product and barcode are present', () => {
    expect(renderConfirm(seat())).toBe('')
    expect(renderConfirm(seat({ product_id: 4 }))).toBe('')
    expect(renderConfirm(seat({ product_id: 4, upc: '   ' }))).toBe('')
  })

  it('opens the label picker when catalog data is missing', () => {
    const markup = renderConfirm(seat({ product_id: 4, upc: '012345678905' }))

    expect(markup).toContain('None declared')
    expect(markup).toContain('Check the package label. Catalog data is incomplete or varies.')
    expect(markup).not.toContain('Loading catalog allergens')
    expect(markup).not.toContain('Edit list')
    expect(markup).not.toContain('Hide list')
    expect(markup).not.toContain('Allergens confirmed')
    expectOrder(markup, [
      'Allergens on the package',
      'None declared',
      'Contains',
      'Milk',
      'Crustacean shellfish',
      'Gluten (wheat, barley, rye)',
      'May contain',
      'Milk',
      'Confirm',
    ])
  })

  it('keeps a confident catalog match collapsed until edit', () => {
    const markup = renderConfirm(
      seat({
        product_id: 4,
        upc: '012345678905',
        allergensCatalogStatus: 'confident',
        allergensContains: ['milk', 'wheat'],
        allergensMayContain: ['soybeans'],
      }),
    )

    expect(markup).toContain('Contains Milk, Wheat')
    expect(markup).toContain('May contain Soybeans')
    expect(markup).toContain('Catalog match — confirm it matches the package.')
    expect(markup).toContain('Edit list')
    expect(markup).not.toContain('aria-pressed')
    expect(markup).not.toContain('Hide list')
    expect(markup).not.toContain('Allergens confirmed')
  })

  it('shows the confirmed banner and an unknown code as itself', () => {
    const markup = renderConfirm(
      seat({
        product_id: 4,
        upc: '012345678905',
        allergensConfirmed: true,
        allergensContains: ['mystery'],
        allergensMayContain: [],
      }),
    )

    expect(markup).toContain('Allergens confirmed')
    expect(markup).toContain('Contains mystery')
    expect(markup).toContain('class="cb-quiet-action"')
    expect(markup).toContain('>Edit<')
    expect(markup).not.toContain('Allergens on the package')
    expect(markup).not.toContain('Confirm')
    expect(markup).not.toContain('May contain')
  })

  it('uses the generic label prompt for an unrecognized catalog status', () => {
    const markup = renderConfirm(
      seat({
        product_id: 4,
        upc: '012345678905',
        allergensCatalogStatus: 'reviewed',
        allergensContains: [],
        allergensMayContain: [],
      }),
    )

    expect(markup).toContain('None declared')
    expect(markup).toContain('Confirm from the package label.')
    expect(markup).toContain('Edit list')
    expect(markup).not.toContain('aria-pressed')
  })
})

describe('AllergenReview', () => {
  const base = {
    contains: new Set<string>(['milk']),
    mayContain: new Set<string>(),
    help: 'Check the package label. Catalog data is incomplete or varies.',
    needsLabelCheck: true,
    onToggle: () => {},
    onConfirm: () => {},
    onEditList: () => {},
    onHideList: () => {},
  }

  it('shows the catalog wait and a retry error', () => {
    const markup = renderToStaticMarkup(
      createElement(AllergenReview, {
        ...base,
        loading: true,
        error: 'Allergen lookup failed',
        showPicker: false,
        editing: false,
      }),
    )

    expect(markup).toContain('Loading catalog allergens…')
    expect(markup).toContain('Allergen lookup failed')
    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('None declared')
    expect(markup).not.toContain('Check the package label')
  })

  it('offers hide while editing, and disables it when the label still needs a check', () => {
    const locked = renderToStaticMarkup(
      createElement(AllergenReview, {
        ...base,
        loading: false,
        error: null,
        showPicker: true,
        editing: true,
        needsLabelCheck: true,
      }),
    )
    const open = renderToStaticMarkup(
      createElement(AllergenReview, {
        ...base,
        loading: false,
        error: null,
        showPicker: true,
        editing: true,
        needsLabelCheck: false,
      }),
    )

    expect(locked).toContain('Hide list')
    expect(locked).toContain('disabled=""')
    expect(locked).toContain('aria-pressed="true"')
    expect(open).toContain('Hide list')
    expect(open).not.toContain('disabled=""')
    expect(open).not.toContain('Edit list')
  })
})
