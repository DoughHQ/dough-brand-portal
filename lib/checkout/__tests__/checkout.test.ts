import { describe, expect, it } from 'vitest'
import { dollarsToCents, formatOrderMoney } from '../money'
import { recordPaymentArgs } from '../payment'
import { conceptListStatus } from '../status'

describe('formatOrderMoney', () => {
  it('formats the stored total, including 30 responses at $30', () => {
    expect(formatOrderMoney(90000, 'usd')).toBe('$900.00')
    expect(formatOrderMoney(105000, 'usd')).toBe('$1,050.00')
  })
})

describe('dollarsToCents', () => {
  it('accepts whole dollars and two decimal places', () => {
    expect(dollarsToCents('35')).toBe(3500)
    expect(dollarsToCents('35.50')).toBe(3550)
    expect(dollarsToCents('1')).toBe(100)
  })

  it('rejects a third decimal and a blank', () => {
    expect(dollarsToCents('35.555')).toBeNull()
    expect(dollarsToCents('')).toBeNull()
    expect(dollarsToCents('0')).toBeNull()
  })
})

describe('recordPaymentArgs', () => {
  it('sends the order amount when the payment is not waived', () => {
    expect(
      recordPaymentArgs({
        missionId: 'm1',
        reference: 'INV-9',
        waived: false,
        amountCents: 90000,
        currency: 'usd',
      })
    ).toEqual({
      p_mission_id: 'm1',
      p_payment_reference: 'INV-9',
      p_waived: false,
      p_amount_cents: 90000,
      p_currency: 'usd',
    })
  })

  it('omits the amount when staff waive the order', () => {
    expect(
      recordPaymentArgs({
        missionId: 'm1',
        reference: 'design partner',
        waived: true,
        amountCents: 90000,
        currency: 'usd',
      })
    ).toEqual({
      p_mission_id: 'm1',
      p_payment_reference: 'design partner',
      p_waived: true,
    })
  })
})

describe('conceptListStatus', () => {
  it('sends an unpaid concept study to checkout and never says in review', () => {
    expect(
      conceptListStatus({
        mission_id: 'abc',
        test_type: 'concept',
        lifecycle_state: 'in_review',
        order_status: 'awaiting_payment',
      })
    ).toEqual({ label: 'Awaiting payment', href: '/studies/abc/checkout' })
  })

  it('leaves a box study in review alone', () => {
    expect(
      conceptListStatus({
        mission_id: 'box',
        test_type: 'ihut',
        lifecycle_state: 'in_review',
        order_status: null,
      })
    ).toBeNull()
  })

  it('does not invent a payment for a concept study with no order', () => {
    expect(
      conceptListStatus({
        mission_id: 'old',
        mission_type: 'concept_test',
        lifecycle_state: 'in_review',
        order_status: null,
      })
    ).toEqual({ label: 'Not live', href: null })
  })
})
