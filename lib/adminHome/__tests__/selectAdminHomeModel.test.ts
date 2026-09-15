import { describe, expect, it } from 'vitest'
import type { OperatorStudyRow } from '@/lib/studies/types'
import type { ReadinessRow } from '@/lib/categoryReadiness.shared'
import {
  adminGreeting,
  buildAttention,
  buildPulse,
  correctionNextLabel,
  isStale,
  pickNearMiss,
  pickStudyHighlight,
  selectAdminHomeModel,
} from '../selectAdminHomeModel'
import type { AdminHomePulse, AdminHomeQueues, AdminHomeSnapshot } from '../types'

const NOW = new Date('2026-09-14T18:00:00.000Z')

const pulse: AdminHomePulse = {
  users: 119,
  users7d: 1,
  battles: 967,
  battles7d: 9,
  scans7d: 12,
  brandsCatalog: 38957,
  brandsClaimed: 12,
  brandsVerified: 3,
  productsCatalog: 551800,
  productsWithElo: 8421,
}

function queues(partial?: Partial<AdminHomeQueues>): AdminHomeQueues {
  return {
    corrections: { count: 0, approveAsIs: 0, oldestAt: null, next: null },
    ownership: { count: 0, oldestAt: null, next: null },
    applications: { pending: 0, exceptions: 0, oldestAt: null, next: null },
    boxes: { attention: 0, next: null },
    ...partial,
  }
}

function snapshot(partial?: Partial<AdminHomeSnapshot>): AdminHomeSnapshot {
  return {
    generatedAt: NOW.toISOString(),
    catalogRefreshedAt: NOW.toISOString(),
    pulse,
    queues: queues(),
    readiness: { sellable: 2, approaching: 4, building: 18, nearMiss: null },
    studies: { live: 0, highlight: null },
    ...partial,
  }
}

function study(partial: Partial<OperatorStudyRow> & Pick<OperatorStudyRow, 'mission_id' | 'lifecycle_state'>): OperatorStudyRow {
  return {
    title: 'Pack test',
    status: 'active',
    is_finished: false,
    brand_id: 1,
    brand_name: 'Acme',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    mission_type: 'concept_test',
    test_type: 'concept',
    total_claims: 0,
    completed_claims: 0,
    created_at: NOW.toISOString(),
    expires_at: null,
    ...partial,
  }
}

function readyRow(partial: Partial<ReadinessRow> & Pick<ReadinessRow, 'name' | 'status'>): ReadinessRow {
  return {
    nodeId: 1,
    l1Name: 'Snacks',
    battles: 10,
    distinctRaters: 40,
    productsBattled: 8,
    raters7d: 2,
    raters30d: 10,
    studyBattlesExcluded: 0,
    compareGroupBattles: 0,
    compareGroupRaters: 0,
    lastBattleAt: null,
    raterThreshold: 50,
    ...partial,
  }
}

function atHour(hour: number): Date {
  return new Date(2026, 8, 14, hour, 0, 0)
}

describe('adminGreeting', () => {
  it('splits the day into morning / afternoon / evening', () => {
    expect(adminGreeting(atHour(8))).toBe('Good morning')
    expect(adminGreeting(atHour(13))).toBe('Good afternoon')
    expect(adminGreeting(atHour(19))).toBe('Good evening')
  })
})

describe('buildAttention', () => {
  it('hides empty queues and marks stale work', () => {
    const rows = buildAttention(
      queues({
        corrections: {
          count: 47,
          approveAsIs: 12,
          oldestAt: '2026-09-01T12:00:00.000Z',
          next: {
            id: 'c1',
            productId: 99,
            name: 'Kind Bar',
            brand: 'Kind',
            type: 'ingredients',
            createdAt: '2026-09-01T12:00:00.000Z',
          },
        },
        applications: {
          pending: 2,
          exceptions: 1,
          oldestAt: NOW.toISOString(),
          next: {
            id: 'w1',
            name: 'Oatly',
            createdAt: NOW.toISOString(),
            exception: true,
          },
        },
      }),
      NOW
    )
    expect(rows.map((r) => r.key)).toEqual(['corrections', 'applications'])
    expect(rows[0].tone).toBe('stale')
    expect(rows[0].href).toContain('focus=c1')
    expect(rows[0].detail).toMatch(/12 ready to approve as-is/)
    expect(rows[1].detail).toMatch(/need a call/)
    expect(rows[1].tone).toBe('work')
  })

  it('deep-links boxes to the hot row', () => {
    const rows = buildAttention(
      queues({
        boxes: {
          attention: 1,
          next: {
            id: 'box-9',
            title: 'Yogurt iHUT',
            status: 'shipping',
            createdAt: NOW.toISOString(),
          },
        },
      }),
      NOW
    )
    expect(rows[0].href).toBe('/admin/boxes/box-9')
    expect(rows[0].detail).toBe('In shipping')
  })
})

describe('correctionNextLabel', () => {
  it('joins brand, product, and type', () => {
    expect(
      correctionNextLabel({
        id: '1',
        productId: 1,
        name: 'Kind Bar',
        brand: 'Kind',
        type: 'nutrition_facts',
        createdAt: NOW.toISOString(),
      })
    ).toBe('Kind · Kind Bar · nutrition')
  })
})

describe('buildPulse', () => {
  it('warns when almost nobody is active and splits claimed vs catalog', () => {
    const cells = buildPulse(snapshot())
    const users = cells.find((c) => c.key === 'users')
    const brands = cells.find((c) => c.key === 'brands')
    const products = cells.find((c) => c.key === 'products')
    const battles = cells.find((c) => c.key === 'battles')
    expect(users?.warn).toBe(true)
    expect(users?.sub).toBe('1 active this week')
    expect(brands?.label).toBe('Claimed brands')
    expect(brands?.value).toBe('12')
    expect(brands?.sub).toMatch(/38,957 in catalog/)
    expect(brands?.sub).toMatch(/3 domain-verified/)
    expect(products?.sub).toBe('8,421 with Elo')
    expect(battles?.sub).toMatch(/9 this week/)
    expect(battles?.sub).toMatch(/12 scans/)
  })
})

describe('pickNearMiss', () => {
  it('picks the category closest to the rater threshold', () => {
    const miss = pickNearMiss([
      readyRow({ name: 'Popcorn', status: 'building', distinctRaters: 10, raterThreshold: 50 }),
      readyRow({ name: 'Snack bars', status: 'approaching', distinctRaters: 47, raterThreshold: 50 }),
      readyRow({ name: 'Soda', status: 'sellable', distinctRaters: 80, raterThreshold: 50 }),
    ])
    expect(miss?.name).toBe('Snack bars')
    expect(miss?.raters).toBe(47)
    expect(miss?.href).toContain('Snack%20bars')
  })
})

describe('pickStudyHighlight', () => {
  it('prefers a stuck live study over results-ready', () => {
    const picked = pickStudyHighlight(
      [
        study({
          mission_id: 'stuck',
          lifecycle_state: 'active',
          title: 'Quiet concept',
          created_at: '2026-09-01T00:00:00.000Z',
          total_claims: 0,
        }),
        study({
          mission_id: 'done',
          lifecycle_state: 'completed',
          status: 'completed',
          title: 'Done pack',
          is_finished: true,
        }),
      ],
      NOW
    )
    expect(picked.live).toBe(1)
    expect(picked.highlight?.kind).toBe('stuck')
    expect(picked.highlight?.title).toBe('Quiet concept')
  })
})

describe('selectAdminHomeModel', () => {
  it('is caught up when every queue is empty', () => {
    const model = selectAdminHomeModel(snapshot(), NOW)
    expect(model.caughtUp).toBe(true)
    expect(model.attention).toEqual([])
    expect(model.greeting).toBe(adminGreeting(NOW))
  })

  it('totals work across visible rows', () => {
    const model = selectAdminHomeModel(
      snapshot({
        queues: queues({
          corrections: {
            count: 4,
            approveAsIs: 1,
            oldestAt: NOW.toISOString(),
            next: null,
          },
          ownership: {
            count: 2,
            oldestAt: NOW.toISOString(),
            next: { id: 'o1', brandName: 'Acme', createdAt: NOW.toISOString() },
          },
        }),
      }),
      NOW
    )
    expect(model.caughtUp).toBe(false)
    expect(model.attentionTotal).toBe(6)
  })
})

describe('isStale', () => {
  it('treats seven days as stale', () => {
    expect(isStale('2026-09-07T18:00:00.000Z', NOW)).toBe(true)
    expect(isStale('2026-09-10T18:00:00.000Z', NOW)).toBe(false)
    expect(isStale(null, NOW)).toBe(false)
  })
})
