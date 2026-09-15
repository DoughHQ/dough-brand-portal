import { describe, expect, it } from 'vitest'
import { badgesFromSnapshot, parseAdminHomeSnapshot } from '../parseAdminHomeSnapshot'

const FIXTURE = {
  generated_at: '2026-09-14T18:00:00.000Z',
  catalog_refreshed_at: '2026-09-14T17:53:00.000Z',
  pulse: {
    users: 119,
    users_7d: 1,
    battles: 967,
    battles_7d: 9,
    scans_7d: 12,
    brands_catalog: 38957,
    brands_claimed: 12,
    brands_verified: 3,
    products_catalog: 551800,
    products_with_elo: 8421,
  },
  queues: {
    corrections: {
      count: 2,
      oldest_at: '2026-09-01T12:00:00.000Z',
      next: {
        id: 'corr-1',
        product_id: 99,
        name: 'Kind Bar',
        brand: 'Kind',
        type: 'ingredients',
        created_at: '2026-09-01T12:00:00.000Z',
      },
    },
    applications: {
      count: 3,
      exceptions: 1,
      oldest_at: '2026-09-10T00:00:00.000Z',
      next: {
        id: 'wait-1',
        label: 'Oatly',
        exception: true,
        created_at: '2026-09-12T00:00:00.000Z',
      },
    },
    ownership: {
      count: 1,
      oldest_at: '2026-09-11T00:00:00.000Z',
      next: {
        id: 'own-1',
        label: 'Acme',
        created_at: '2026-09-11T00:00:00.000Z',
      },
    },
    boxes: {
      count: 1,
      next: {
        id: 'box-9',
        label: 'Yogurt iHUT',
        status: 'shipping',
        created_at: '2026-09-13T00:00:00.000Z',
      },
    },
  },
  studies: {
    live_count: 2,
    highlight: {
      kind: 'stuck',
      id: 'mission-stuck',
      title: 'Quiet concept',
      detail: 'Live with no claims',
      mission_type: 'concept_test',
    },
  },
}

describe('parseAdminHomeSnapshot', () => {
  it('maps the RPC document into the portal snapshot', () => {
    const snap = parseAdminHomeSnapshot(FIXTURE)
    expect(snap.generatedAt).toBe('2026-09-14T18:00:00.000Z')
    expect(snap.catalogRefreshedAt).toBe('2026-09-14T17:53:00.000Z')
    expect(snap.pulse.brandsClaimed).toBe(12)
    expect(snap.pulse.productsWithElo).toBe(8421)
    expect(snap.queues.corrections.approveAsIs).toBe(0)
    expect(snap.queues.corrections.next?.productId).toBe(99)
    expect(snap.queues.applications.pending).toBe(3)
    expect(snap.queues.applications.next?.exception).toBe(true)
    expect(snap.queues.applications.next?.name).toBe('Oatly')
    expect(snap.queues.ownership.next?.brandName).toBe('Acme')
    expect(snap.queues.boxes.next?.title).toBe('Yogurt iHUT')
    expect(snap.studies.live).toBe(2)
    expect(snap.studies.highlight?.kind).toBe('stuck')
    expect(snap.studies.highlight?.href).toBe('/studies/concept/mission-stuck')
    expect(snap.readiness.nearMiss).toBeNull()
  })

  it('tolerates null nexts and empty highlight', () => {
    const snap = parseAdminHomeSnapshot({
      generated_at: '2026-09-14T18:00:00.000Z',
      catalog_refreshed_at: null,
      pulse: { users: 0, users_7d: 0, battles: 0, battles_7d: 0, scans_7d: 0,
        brands_catalog: 0, brands_claimed: 0, brands_verified: 0,
        products_catalog: 0, products_with_elo: 0 },
      queues: {
        corrections: { count: 0, oldest_at: null, next: null },
        applications: { count: 0, exceptions: 0, oldest_at: null, next: null },
        ownership: { count: 0, oldest_at: null, next: null },
        boxes: { count: 0, next: null },
      },
      studies: { live_count: 0, highlight: null },
    })
    expect(snap.queues.corrections.next).toBeNull()
    expect(snap.studies.highlight).toBeNull()
    expect(snap.catalogRefreshedAt).toBeNull()
  })

  it('builds results href for non-concept studies', () => {
    const snap = parseAdminHomeSnapshot({
      ...FIXTURE,
      studies: {
        live_count: 0,
        highlight: {
          kind: 'results',
          id: 'm-done',
          title: 'Pack done',
          detail: 'Results ready',
          mission_type: 'product_discovery',
        },
      },
    })
    expect(snap.studies.highlight?.href).toBe('/reports/m-done')
  })
})

describe('badgesFromSnapshot', () => {
  it('mirrors Needs attention counts', () => {
    const snap = parseAdminHomeSnapshot(FIXTURE)
    expect(badgesFromSnapshot(snap)).toEqual({
      corrections: 2,
      ownership: 1,
      applications: 3,
      boxes: 1,
    })
  })
})
