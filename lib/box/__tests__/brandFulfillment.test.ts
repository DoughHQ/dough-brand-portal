import { describe, expect, it } from 'vitest'
import {
  brandAddressChangeCopy,
  brandFulfillmentsToCsv,
  formatLabelAddress,
  mergeBrandShipHolds,
  packingHref,
  type BrandFulfillmentRow,
} from '../brandFulfillment'

function seat(
  overrides: Partial<BrandFulfillmentRow> & Pick<BrandFulfillmentRow, 'fulfillment_id' | 'state'>
): BrandFulfillmentRow {
  return {
    abandon_deadline: null,
    carrier: null,
    claimed_at: null,
    completed_at: null,
    confirmed_at: null,
    consent_version: null,
    consented_at: null,
    delivered_at: null,
    dings_reliability: false,
    left_at: null,
    left_reason: null,
    recipient_name: null,
    session_1_completed_at: null,
    session_2_completed_at: null,
    ship_city: null,
    ship_country: null,
    ship_hold: null,
    ship_line1: null,
    ship_line2: null,
    ship_phone: null,
    ship_postal: null,
    ship_state: null,
    shipped_at: null,
    terminal_reason: null,
    tracking_ref: null,
    ...overrides,
  }
}

describe('formatLabelAddress', () => {
  it('builds a multi-line US label', () => {
    expect(
      formatLabelAddress({
        recipient_name: 'Ada Lovelace',
        ship_line1: '123 Market St',
        ship_line2: 'Apt 4',
        ship_city: 'Austin',
        ship_state: 'TX',
        ship_postal: '78701',
        ship_country: 'US',
        ship_phone: '+15125550123',
      })
    ).toBe('Ada Lovelace\n123 Market St\nApt 4\nAustin, TX 78701\n+15125550123')
  })

  it('omits blank lines and keeps non-US country', () => {
    expect(
      formatLabelAddress({
        recipient_name: 'Bea',
        ship_line1: '10 King',
        ship_line2: null,
        ship_city: 'Toronto',
        ship_state: 'ON',
        ship_postal: 'M5V 1A1',
        ship_country: 'CA',
        ship_phone: null,
      })
    ).toBe('Bea\n10 King\nToronto, ON M5V 1A1\nCA')
  })

  it('returns empty when nothing is set', () => {
    expect(
      formatLabelAddress({
        recipient_name: null,
        ship_line1: null,
        ship_line2: null,
        ship_city: null,
        ship_state: null,
        ship_postal: null,
        ship_country: null,
        ship_phone: null,
      })
    ).toBe('')
  })
})

describe('brandFulfillmentsToCsv', () => {
  it('emits a header and escaped rows', () => {
    const csv = brandFulfillmentsToCsv([
      seat({
        fulfillment_id: 'f1',
        state: 'fulfillment_pending',
        recipient_name: 'Ada, "A"',
        ship_line1: '1 Main',
        ship_city: 'Austin',
        ship_state: 'TX',
        ship_postal: '78701',
        ship_country: 'US',
        ship_phone: '+1',
      }),
    ])
    expect(csv).toContain(
      'recipient_name,ship_line1,ship_line2,ship_city,ship_state,ship_postal,ship_country,ship_phone,fulfillment_id,state'
    )
    expect(csv).toContain('"Ada, ""A""",1 Main,,Austin,TX,78701,US,+1,f1,fulfillment_pending')
  })
})

describe('brandAddressChangeCopy', () => {
  it('asks the brand to reprint without telling themselves', () => {
    const now = Date.parse('2026-10-15T03:00:00Z')
    expect(
      brandAddressChangeCopy(
        {
          fulfillment_id: 'a',
          changed_at: '2026-10-15T01:00:00Z',
          state_at_change: 'fulfillment_pending',
          source: 'box',
        },
        now
      )
    ).toBe('Address changed 2h ago, after it was queued · reprint the label')
  })
})

describe('mergeBrandShipHolds', () => {
  it('keeps RPC holds when present', () => {
    expect(
      mergeBrandShipHolds(
        { a: 'ALLERGEN_CONFLICT' },
        [seat({ fulfillment_id: 'a', state: 'confirmed', ship_hold: 'ADDRESS_UNUSABLE' })]
      )
    ).toEqual({ a: 'ALLERGEN_CONFLICT' })
  })

  it('falls back to inline ship_hold on list rows', () => {
    expect(
      mergeBrandShipHolds({}, [
        seat({ fulfillment_id: 'a', state: 'confirmed', ship_hold: 'ADDRESS_UNUSABLE' }),
        seat({ fulfillment_id: 'b', state: 'confirmed', ship_hold: 'SOMETHING_NEW' }),
      ])
    ).toEqual({ a: 'ADDRESS_UNUSABLE' })
  })
})

describe('packingHref', () => {
  it('points at the brand packing console', () => {
    expect(packingHref('box-uuid')).toBe('/studies/box/box-uuid/fulfillment')
  })
})
