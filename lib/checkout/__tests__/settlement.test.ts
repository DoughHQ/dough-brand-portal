import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { parseStudyOrder } from '../load'
import {
  checkoutErrorMessage,
  isOrderSettled,
  recordRefundArgs,
  type StudyOrderRow,
} from '../payment'
import {
  checkoutLede,
  checkoutSettlementLines,
  isMissionEnded,
} from '../settlementCopy'

function order(overrides: Partial<StudyOrderRow> = {}): StudyOrderRow {
  return {
    mission_id: 'm1',
    brand_id: 1,
    title: 'Study',
    completions: 30,
    unit_price_cents: 3000,
    amount_cents: 90000,
    currency: 'usd',
    status: 'paid',
    payment_reference: 'INV-1',
    paid_at: '2026-10-01T12:00:00.000Z',
    created_at: '2026-09-01T12:00:00.000Z',
    settled_at: null,
    delivered_completions: null,
    refund_due_cents: null,
    refund_method: null,
    refund_reference: null,
    refunded_cents: null,
    refunded_at: null,
    ...overrides,
  }
}

describe('parseStudyOrder settlement', () => {
  it('parses numeric strings and nullable settlement fields', () => {
    const parsed = parseStudyOrder({
      mission_id: 'm1',
      brand_id: 1,
      title: 'Study',
      completions: '30',
      unit_price_cents: '3000',
      amount_cents: '90000',
      currency: 'usd',
      status: 'paid',
      payment_reference: null,
      paid_at: null,
      created_at: '2026-09-01T12:00:00.000Z',
      settled_at: '2026-10-13T21:00:00.000Z',
      delivered_completions: '12',
      refund_due_cents: '54000',
      refund_method: 'refund',
      refund_reference: 're_9',
      refunded_cents: null,
      refunded_at: null,
    })
    expect(parsed).toMatchObject({
      completions: 30,
      amount_cents: 90000,
      settled_at: '2026-10-13T21:00:00.000Z',
      delivered_completions: 12,
      refund_due_cents: 54000,
      refund_method: 'refund',
      refund_reference: 're_9',
    })
    expect(isOrderSettled(parsed!)).toBe(true)
  })

  it('fills amount from unit × completions when amount is null', () => {
    const parsed = parseStudyOrder({
      mission_id: 'm1',
      brand_id: 1,
      title: 'Study',
      completions: 10,
      unit_price_cents: 2500,
      amount_cents: null,
      currency: 'usd',
      status: 'awaiting_payment',
      payment_reference: null,
      paid_at: null,
      created_at: '2026-09-01T12:00:00.000Z',
    })
    expect(parsed?.amount_cents).toBe(25000)
    expect(parsed?.settled_at).toBeNull()
  })

  it('rejects malformed settlement numbers and methods', () => {
    expect(
      parseStudyOrder({
        mission_id: 'm1',
        brand_id: 1,
        title: 'Study',
        completions: 10,
        unit_price_cents: 2500,
        amount_cents: 25000,
        currency: 'usd',
        status: 'paid',
        payment_reference: null,
        paid_at: null,
        created_at: '2026-09-01T12:00:00.000Z',
        refund_due_cents: 'nope',
      })
    ).toBeNull()

    expect(
      parseStudyOrder({
        mission_id: 'm1',
        brand_id: 1,
        title: 'Study',
        completions: 10,
        unit_price_cents: 2500,
        amount_cents: 25000,
        currency: 'usd',
        status: 'paid',
        payment_reference: null,
        paid_at: null,
        created_at: '2026-09-01T12:00:00.000Z',
        refund_method: 'wire',
      })
    ).toBeNull()
  })
})

describe('recordRefundArgs and refund hints', () => {
  it('builds refund RPC args', () => {
    expect(
      recordRefundArgs({
        missionId: 'm1',
        reference: '  re_abc  ',
        method: 'credit',
      })
    ).toEqual({
      p_mission_id: 'm1',
      p_reference: 're_abc',
      p_method: 'credit',
    })
  })

  it('maps every refund hint', () => {
    expect(checkoutErrorMessage({ hint: 'REFUND_REFERENCE_REQUIRED' })).toContain(
      'Stripe refund'
    )
    expect(checkoutErrorMessage({ hint: 'INVALID_REFUND_METHOD' })).toContain('refund')
    expect(checkoutErrorMessage({ hint: 'NOT_SETTLED' })).toContain("isn't settled")
    expect(checkoutErrorMessage({ hint: 'ALREADY_REFUNDED' })).toContain('already recorded')
    expect(checkoutErrorMessage({ hint: 'NOTHING_DUE' })).toContain('owes no refund')
  })
})

describe('checkoutSettlementLines', () => {
  it('stays empty until the order is settled', () => {
    expect(checkoutSettlementLines(order())).toEqual([])
    expect(checkoutLede({ orderPaidOrWaived: false, missionStatus: null })).toContain(
      'blind read'
    )
    expect(isMissionEnded('expired')).toBe(true)
  })

  it('describes owed, refunded, credited, and nothing-due', () => {
    expect(
      checkoutSettlementLines(
        order({
          settled_at: '2026-10-13T21:00:00.000Z',
          delivered_completions: 12,
          refund_due_cents: 54000,
        })
      )
    ).toEqual([
      '12 responses delivered.',
      "$540.00 is owed back to you. We'll confirm here when it's sent.",
    ])

    expect(
      checkoutSettlementLines(
        order({
          settled_at: '2026-10-13T21:00:00.000Z',
          delivered_completions: 12,
          refund_due_cents: 54000,
          refund_method: 'refund',
          refund_reference: 're_9',
          refunded_cents: 54000,
          refunded_at: '2026-10-14T15:00:00.000Z',
        })
      ).at(-1)
    ).toContain('$540.00 was refunded')

    expect(
      checkoutSettlementLines(
        order({
          settled_at: '2026-10-13T21:00:00.000Z',
          delivered_completions: 12,
          refund_due_cents: 54000,
          refund_method: 'credit',
          refund_reference: 'CN-1',
          refunded_cents: 54000,
          refunded_at: '2026-10-14T15:00:00.000Z',
        })
      ).at(-1)
    ).toContain('credited toward your next study')

    expect(
      checkoutSettlementLines(
        order({
          settled_at: '2026-10-13T21:00:00.000Z',
          delivered_completions: 30,
          refund_due_cents: 0,
        })
      )
    ).toContain('Nothing is owed back on this order.')
  })
})
