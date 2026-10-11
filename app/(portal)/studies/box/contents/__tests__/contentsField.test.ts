import { describe, expect, it } from 'vitest'
import type { AdminProductSearchResult } from '@/lib/queries'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '@/lib/box/defaults'
import type { BoxFieldRow } from '@/lib/box/types'
import { catalogSeatFromPick } from '../catalogSeat'
import { priceReadinessLabel } from '../priceReadiness'

function searchResult(
  overrides: Partial<AdminProductSearchResult> = {}
): AdminProductSearchResult {
  return {
    product_id: 42,
    product_name_clean: 'Keel Lemon',
    brand_name: 'Keel',
    brand_id: 7,
    l2_name: 'Water',
    l3_name: 'Sparkling water',
    battles_total: 0,
    win_rate_pct: null,
    elo_score: null,
    milestone: '',
    image_url: 'https://example.test/keel.png',
    taxonomy_node_id: 11,
    l2_node_id: 3,
    l1_name: 'Beverages',
    ...overrides,
  }
}

function seat(overrides: Partial<BoxFieldRow>): BoxFieldRow {
  return {
    ...createEmptyBoxFieldRow(),
    product_id: 1,
    role: 'yours',
    frozen_display_name: 'Seat',
    ...overrides,
  }
}

describe('catalogSeatFromPick', () => {
  it('snapshots a catalog pick without confirming identity', () => {
    const row = catalogSeatFromPick(searchResult(), 'competitor', ' 012345678905 ')

    expect(row.kind).toBe('product')
    expect(row.role).toBe('competitor')
    expect(row.product_id).toBe(42)
    expect(row.frozen_display_name).toBe('Keel Lemon')
    expect(row.frozen_brand_name).toBe('Keel')
    expect(row.frozen_image_url).toBe('https://example.test/keel.png')
    expect(row.taxonomy_node_id).toBe(11)
    expect(row.l2_node_id).toBe(3)
    expect(row.frozen_category).toBe('Sparkling water')
    expect(row.upc).toBe('012345678905')
    expect(row.identityConfirmed).toBe(false)
  })
})

describe('priceReadinessLabel', () => {
  it('stays quiet until two seats exist', () => {
    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [seat({ localId: 'a' })]
    expect(priceReadinessLabel(draft)).toBeNull()
  })

  it('turns price checks off for a plain sample', () => {
    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [
      seat({ localId: 'a', price: 3.49 }),
      seat({
        localId: 'b',
        kind: 'prototype',
        product_id: null,
        prototype_id: 'proto-1',
        packaging: 'plain_sample',
        price: 4,
      }),
    ]
    expect(priceReadinessLabel(draft)).toBe('Taste-only box — price checks off')
  })

  it('reports complete and incomplete packaged pricing', () => {
    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [
      seat({ localId: 'a', price: 3.49 }),
      seat({ localId: 'b', role: 'competitor', product_id: 2, price: 2.5 }),
    ]
    expect(priceReadinessLabel(draft)).toBe('All seats priced · price checks on')

    draft.fieldProducts[1]!.price = null
    expect(priceReadinessLabel(draft)).toBe('Incomplete pricing · price checks off')
  })
})
