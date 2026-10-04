import { describe, expect, it } from 'vitest'
import {
  applyPrototypeToSeat,
  clearCatalogFromSeat,
  clearPrototypeFromSeat,
  createPrototypeSeatFromItem,
} from '../applyPrototypeSeat'
import { createEmptyBoxFieldRow } from '../defaults'
import type { PrototypeListItem } from '@/lib/prototypes/types'

function readyProto(
  over: Partial<PrototypeListItem> = {}
): PrototypeListItem {
  return {
    id: 'proto-1',
    brand_id: 7,
    name: 'Keel Lemon Proto',
    internal_label: 'KL-01',
    taxonomy_node_id: 42,
    packaging: 'final_packaging',
    planned_price: 3.49,
    image_paths: ['prototype-images/7/a.jpg'],
    allergens_contains: ['milk'],
    allergens_may_contain: [],
    allergens_declared_at: '2026-10-01T00:00:00Z',
    allergens_declared_by: null,
    created_by: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    archived_at: null,
    archived_by: null,
    readiness: 'ready',
    category_label: 'Sparkling Water',
    ...over,
  }
}

describe('applyPrototypeToSeat', () => {
  it('binds library identity and clears catalog fields', () => {
    const catalog = {
      ...createEmptyBoxFieldRow(),
      kind: 'product' as const,
      role: 'yours' as const,
      product_id: 99,
      upc: '012345678905',
      identityConfirmed: true,
      allergensConfirmed: true,
      allergensContains: ['egg'],
      frozen_display_name: 'Catalog thing',
    }
    const next = applyPrototypeToSeat(catalog, readyProto(), {
      imageUrl: 'https://signed.example/a.jpg',
    })
    expect(next.kind).toBe('prototype')
    expect(next.role).toBe('yours')
    expect(next.prototype_id).toBe('proto-1')
    expect(next.product_id).toBeNull()
    expect(next.upc).toBeNull()
    expect(next.identityConfirmed).toBe(false)
    expect(next.allergensConfirmed).toBe(false)
    expect(next.frozen_display_name).toBe('Keel Lemon Proto')
    expect(next.frozen_brand_name).toBe('KL-01')
    expect(next.frozen_image_url).toBe('https://signed.example/a.jpg')
    expect(next.price).toBe(3.49)
    expect(next.packaging).toBe('final_packaging')
    expect(next.prototypeSnapshot?.readiness).toBe('ready')
  })

  it('creates a fresh competitor seat from a pick', () => {
    const seat = createPrototypeSeatFromItem(
      readyProto({ packaging: 'plain_sample', planned_price: null })
    )
    expect(seat.kind).toBe('prototype')
    expect(seat.role).toBe('competitor')
    expect(seat.packaging).toBe('plain_sample')
    expect(seat.price).toBeNull()
  })

  it('clears prototype vs catalog when switching kinds', () => {
    const proto = createPrototypeSeatFromItem(readyProto())
    const asCatalog = clearPrototypeFromSeat(proto)
    expect(asCatalog.kind).toBe('product')
    expect(asCatalog.prototype_id).toBeNull()
    expect(asCatalog.prototypeSnapshot).toBeNull()

    const asProto = clearCatalogFromSeat({
      ...createEmptyBoxFieldRow(),
      product_id: 1,
      upc: '1',
      frozen_display_name: 'X',
    })
    expect(asProto.kind).toBe('prototype')
    expect(asProto.product_id).toBeNull()
    expect(asProto.prototype_id).toBeNull()
  })
})
