import { describe, expect, it } from 'vitest'
import {
  fetchBoxShipHolds,
  fulfillmentHasAddress,
  fulfillmentSeatStatus,
  fulfillmentWaitingCopy,
  humanizeFulfillmentError,
  isOperatorFulfillmentAction,
  operatorActionsFor,
  parseShipHolds,
  shipHoldCopy,
  type FulfillmentRow,
} from '../fulfillment'

type SeatFixture = {
  state: FulfillmentRow['state']
  left_at: string | null
  left_reason: string | null
  consented_at: string | null
  consent_version: string | null
  tracking_ref: string | null
  carrier: string | null
  dings_reliability: boolean
  ship_city: string | null
  recipient_name: string | null
}

function row(
  overrides: Partial<SeatFixture> & Pick<SeatFixture, 'state'>
): SeatFixture {
  return {
    left_at: null,
    left_reason: null,
    consented_at: null,
    consent_version: null,
    tracking_ref: null,
    carrier: null,
    dings_reliability: false,
    ship_city: null,
    recipient_name: null,
    ...overrides,
  }
}

describe('operatorActionsFor', () => {
  const ready = { consentedAt: '2026-10-13T12:00:00Z', hasAddress: true }
  const waiting = { consentedAt: null, hasAddress: false }

  it('offers nothing on claimed — confirm is respondent-only', () => {
    expect(operatorActionsFor('claimed', ready)).toEqual([])
    expect(operatorActionsFor('claimed', waiting)).toEqual([])
  })

  it('withholds ship until consent and address are on file', () => {
    expect(operatorActionsFor('confirmed', waiting)).toEqual(['delivery_failed'])
    expect(
      operatorActionsFor('confirmed', {
        consentedAt: '2026-10-13T12:00:00Z',
        hasAddress: false,
      })
    ).toEqual(['delivery_failed'])
    expect(operatorActionsFor('confirmed', ready)).toEqual([
      'shipped',
      'delivery_failed',
    ])
    expect(operatorActionsFor('fulfillment_pending', ready)).toEqual([
      'shipped',
      'delivery_failed',
    ])
  })

  it('gates retry delivery the same way', () => {
    expect(operatorActionsFor('delivery_failed', waiting)).toEqual([])
    expect(operatorActionsFor('delivery_failed', ready)).toEqual([
      'fulfillment_pending',
    ])
  })

  it('offers nothing on left or sweep-expired seats', () => {
    expect(operatorActionsFor('claim_expired', ready)).toEqual([])
    expect(operatorActionsFor('claim_expired', waiting)).toEqual([])
  })

  it('keeps shipped delivery actions without a consent re-check', () => {
    expect(operatorActionsFor('shipped', waiting)).toEqual([
      'delivered',
      'delivery_failed',
    ])
  })
})

describe('isOperatorFulfillmentAction', () => {
  it('rejects confirmed', () => {
    expect(isOperatorFulfillmentAction('confirmed')).toBe(false)
    expect(isOperatorFulfillmentAction('shipped')).toBe(true)
  })
})

describe('fulfillmentSeatStatus', () => {
  it('distinguishes left from sweep expiry', () => {
    expect(
      fulfillmentSeatStatus(
        row({
          state: 'claim_expired',
          left_at: '2026-10-13T12:00:00Z',
          left_reason: 'allergy',
        })
      )
    ).toBe('Left · allergy or ingredient')
    expect(
      fulfillmentSeatStatus(row({ state: 'claim_expired' }))
    ).toBe('Claim expired · sweep')
  })

  it('shows waiting vs agreed', () => {
    expect(fulfillmentSeatStatus(row({ state: 'claimed' }))).toBe(
      'Waiting for respondent to confirm'
    )
    expect(
      fulfillmentSeatStatus(
        row({
          state: 'confirmed',
          consented_at: '2026-10-13T12:00:00Z',
          consent_version: 'v1',
        })
      )
    ).toBe('Agreed · v1 · Confirmed')
  })
})

describe('fulfillmentWaitingCopy', () => {
  it('explains why ship is withheld', () => {
    const waiting = { consentedAt: null, hasAddress: false }
    expect(fulfillmentWaitingCopy('claimed', waiting)).toBe(
      'Waiting for the respondent to confirm'
    )
    expect(fulfillmentWaitingCopy('confirmed', waiting)).toBe(
      'Waiting for the respondent to confirm'
    )
    expect(
      fulfillmentWaitingCopy('confirmed', {
        consentedAt: '2026-10-13T12:00:00Z',
        hasAddress: true,
      })
    ).toBeNull()
  })
})

describe('fulfillmentHasAddress', () => {
  it('treats city or recipient as address on file', () => {
    expect(fulfillmentHasAddress({ ship_city: 'Austin', recipient_name: null })).toBe(
      true
    )
    expect(
      fulfillmentHasAddress({ ship_city: null, recipient_name: 'Ada' })
    ).toBe(true)
    expect(fulfillmentHasAddress({ ship_city: null, recipient_name: null })).toBe(
      false
    )
  })
})

describe('humanizeFulfillmentError', () => {
  it('maps Phase 0 HINT codes without leaking them', () => {
    const mustConfirm = humanizeFulfillmentError(
      'only the respondent can confirm a box seat',
      'RESPONDENT_MUST_CONFIRM'
    )
    expect(mustConfirm).not.toContain('RESPONDENT_MUST_CONFIRM')
    expect(mustConfirm.toLowerCase()).toContain('respondent')

    const noConsent = humanizeFulfillmentError(
      'this seat has no address or no recorded agreement',
      'NO_FINAL_CONSENT'
    )
    expect(noConsent).not.toContain('NO_FINAL_CONSENT')
    expect(noConsent.toLowerCase()).toMatch(/address|terms/)
  })

  it('keeps the older string matches', () => {
    expect(humanizeFulfillmentError('not authorized')).toBe('Not authorized.')
    expect(humanizeFulfillmentError('row is terminal')).toBe(
      'This seat is already in a final state.'
    )
  })
})

describe('ship holds', () => {
  const ready = { consentedAt: '2026-10-14T00:00:00Z', hasAddress: true }
  const held = { ...ready, shipHold: 'ALLERGEN_CONFLICT' as const }

  it('withholds ship and re-ship on a held seat', () => {
    expect(operatorActionsFor('confirmed', held)).toEqual(['delivery_failed'])
    expect(operatorActionsFor('fulfillment_pending', held)).toEqual(['delivery_failed'])
    expect(operatorActionsFor('delivery_failed', held)).toEqual([])
    expect(operatorActionsFor('confirmed', ready)).toEqual(['shipped', 'delivery_failed'])
  })

  it('leaves shipped seats alone', () => {
    expect(operatorActionsFor('shipped', held)).toEqual(['delivered', 'delivery_failed'])
  })

  it('shows the hold instead of the waiting copy', () => {
    expect(fulfillmentWaitingCopy('confirmed', { ...held, consentedAt: null })).toBeNull()
    expect(shipHoldCopy('ALLERGEN_CONFLICT')).toContain('Do not pack')
    expect(shipHoldCopy('ALLERGENS_UNCONFIRMED')).toContain('unconfirmed')
  })

  it('parses the console list and drops anything unexpected', () => {
    expect(
      parseShipHolds([
        { fulfillment_id: 'a', ship_hold: 'ALLERGEN_CONFLICT' },
        { fulfillment_id: 'b', ship_hold: 'ALLERGENS_UNCONFIRMED' },
        { fulfillment_id: 'c', ship_hold: 'SOMETHING_NEW' },
        { ship_hold: 'ALLERGEN_CONFLICT' },
        null,
      ])
    ).toEqual({ a: 'ALLERGEN_CONFLICT', b: 'ALLERGENS_UNCONFIRMED' })
    expect(parseShipHolds(null)).toEqual({})
  })

  it('reads a missing RPC (before the backend apply) as no holds', async () => {
    const client = {
      rpc: async () => ({ data: null, error: { message: 'Could not find the function' } }),
    }
    await expect(
      fetchBoxShipHolds(client as unknown as Parameters<typeof fetchBoxShipHolds>[0], 'box')
    ).resolves.toEqual({})
  })

  it('explains a refused ship', () => {
    expect(humanizeFulfillmentError('this seat is on hold', 'SHIP_HOLD_ALLERGEN_CONFLICT')).toContain(
      'allergies now conflict'
    )
    expect(
      humanizeFulfillmentError('this seat is on hold', 'SHIP_HOLD_ALLERGENS_UNCONFIRMED')
    ).toContain('unconfirmed')
  })
})
