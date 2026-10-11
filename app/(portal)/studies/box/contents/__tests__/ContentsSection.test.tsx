import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '@/lib/box/defaults'
import type { BoxFieldRow, BoxStudyDraft } from '@/lib/box/types'
import ContentsSection from '../../ContentsSection'

vi.mock('server-only', () => ({}))

function seat(overrides: Partial<BoxFieldRow>): BoxFieldRow {
  return {
    ...createEmptyBoxFieldRow(),
    product_id: 1,
    role: 'yours',
    upc: '012345678905',
    identityConfirmed: true,
    frozen_display_name: 'Keel Lemon',
    frozen_brand_name: 'Keel',
    price: 3.49,
    ...overrides,
  }
}

function html(draft: BoxStudyDraft, error?: string) {
  return renderToStaticMarkup(
    createElement(ContentsSection, {
      draft,
      onChange: () => {},
      error,
    })
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

describe('ContentsSection', () => {
  it('renders the empty field and the three add actions', () => {
    const markup = html(createEmptyBoxDraft(1))

    expect(markup).toContain('id="box-field"')
    expectOrder(markup, [
      'Build the field',
      'Two to five seats that ship in the box',
      'What goes in the box?',
      '+ Your catalog product',
      '+ Your prototype',
      '+ Competitor product',
    ])
    expect(markup).not.toContain('Shelf price')
    expect(markup).not.toContain('price checks')
  })

  it('keeps seat identity, role, and price readiness in order', () => {
    const draft = createEmptyBoxDraft(1)
    draft.taxonomyNodeId = 9
    draft.fieldProducts = [
      seat({ localId: 'yours', taxonomy_node_id: 9 }),
      seat({
        localId: 'other',
        role: 'competitor',
        product_id: 2,
        frozen_display_name: 'Shelf Cola',
        frozen_brand_name: 'Other',
        taxonomy_node_id: 4,
        price: null,
      }),
    ]
    const markup = html(draft, 'Choose a focal product.')

    expectOrder(markup, [
      'Incomplete pricing · price checks off',
      'Yours',
      'Catalog',
      'Keel Lemon',
      'Role',
      'Shelf price',
      'Competitor',
      'Different category',
      'Shelf Cola',
      '2 of 5 seats in the box',
      'Choose a focal product.',
    ])
    expect(markup).toContain('aria-label="Remove Keel Lemon"')
    expect(markup).toContain('role="alert"')
  })

  it('shows the taste-only note when a plain sample is in the box', () => {
    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [
      seat({ localId: 'yours' }),
      seat({
        localId: 'proto',
        kind: 'prototype',
        product_id: null,
        prototype_id: 'proto-1',
        role: 'competitor',
        packaging: 'plain_sample',
        frozen_display_name: 'Unlabeled sample',
        frozen_brand_name: '',
        upc: null,
        price: null,
      }),
    ]
    const markup = html(draft)

    expect(markup).toContain('Taste-only box — price checks off')
    expect(markup).toContain('Plain sample')
    expect(markup).toContain('Plain samples run taste-only')
    expect(markup).toContain('Prototype')
  })
})
