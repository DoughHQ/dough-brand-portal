import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import BoxPrototypePickSlot from '../../BoxPrototypePickSlot'
import PrototypeLibraryEmpty from '../PrototypeLibraryEmpty'
import PrototypePickError from '../PrototypePickError'
import PrototypeReadyList from '../PrototypeReadyList'

vi.mock('server-only', () => ({}))

function item(overrides: Partial<PrototypeListItem> = {}): PrototypeListItem {
  return {
    id: 'proto-1',
    brand_id: 1,
    name: 'Oat bar',
    internal_label: null,
    taxonomy_node_id: 4,
    packaging: 'final_packaging',
    planned_price: null,
    image_paths: ['packs/oat.png'],
    allergens_contains: [],
    allergens_may_contain: [],
    allergens_declared_at: '2026-01-01T00:00:00.000Z',
    allergens_declared_by: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    archived_at: null,
    archived_by: null,
    readiness: 'ready',
    category_label: null,
    ...overrides,
  }
}

function renderSlot(onCancel?: () => void) {
  return renderToStaticMarkup(
    createElement(BoxPrototypePickSlot, {
      taken: new Set<string>(),
      onPick: () => {},
      onCancel,
    }),
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

describe('BoxPrototypePickSlot', () => {
  it('waits for the library before listing prototypes', () => {
    const markup = renderSlot()

    expect(markup).toContain('class="cb-field-note"')
    expect(markup).not.toContain('Cancel')
    expect(markup).not.toContain('No ready prototypes')
    expect(markup).not.toContain('Manage library')
    expectOrder(markup, ['Choose a ready prototype', 'Loading library…'])
  })

  it('offers cancel while the library is loading', () => {
    const markup = renderSlot(() => {})

    expectOrder(markup, ['Choose a ready prototype', 'class="cb-quiet-action"', 'Cancel', 'Loading library…'])
  })
})

describe('PrototypeLibraryEmpty', () => {
  it('points at the library when nothing is ready', () => {
    const markup = renderToStaticMarkup(
      createElement(PrototypeLibraryEmpty, { notReady: [] }),
    )

    expect(markup).toContain('href="/prototypes"')
    expect(markup).not.toContain('in the library still')
    expectOrder(markup, [
      'No ready prototypes yet. A seatable sample needs a photo and a declared',
      'allergen list.',
      'Open prototype library →',
    ])
  })

  it('names one unfinished prototype, and ellipsizes a longer queue', () => {
    const one = renderToStaticMarkup(
      createElement(PrototypeLibraryEmpty, {
        notReady: [item({ readiness: 'needs_allergens' })],
      }),
    )
    const two = renderToStaticMarkup(
      createElement(PrototypeLibraryEmpty, {
        notReady: [
          item({ id: 'a', readiness: 'needs_photo' }),
          item({ id: 'b', readiness: 'incomplete' }),
        ],
      }),
    )

    expect(one).toContain('1 in the library still needs work (needs allergens).')
    expect(one).not.toContain(', …')
    expect(two).toContain('2 in the library still need work (needs photo, …).')
  })
})

describe('PrototypeReadyList', () => {
  it('lists ready prototypes and a way back to the library', () => {
    const markup = renderToStaticMarkup(
      createElement(PrototypeReadyList, {
        ready: [
          item({ category_label: 'Bars' }),
          item({
            id: 'proto-2',
            name: 'Plain crisp',
            packaging: 'plain_sample',
            category_label: 'Crackers',
          }),
        ],
        taken: new Set<string>(['proto-2']),
        pickingId: 'proto-1',
        onPick: () => {},
      }),
    )

    expect(markup).toContain('aria-hidden="true"')
    expect(markup).not.toContain('<img')
    expect(markup).toContain('href="/prototypes"')
    expectOrder(markup, [
      'Oat bar',
      'Bars',
      '· Final packaging',
      '· Adding…',
      'Plain crisp',
      'Crackers',
      '· Plain sample',
      '· Already in this box',
      'Need a new sample?',
      'Manage library',
    ])
  })
})

describe('PrototypePickError', () => {
  it('shows the library failure', () => {
    const markup = renderToStaticMarkup(
      createElement(PrototypePickError, { message: 'Could not load prototypes.' }),
    )

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Could not load prototypes.')
  })
})
