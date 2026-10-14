import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { StudyOrderRow } from '@/lib/checkout/payment'

vi.mock('../../checkoutActions', () => ({
  recordStudyRefundAction: vi.fn(),
}))

import StudyRefundsOwed from '../StudyRefundsOwed'

function order(overrides: Partial<StudyOrderRow> = {}): StudyOrderRow {
  return {
    mission_id: 'm-owed',
    brand_id: 4,
    title: 'Ended cocoa',
    completions: 30,
    unit_price_cents: 3000,
    amount_cents: 90000,
    currency: 'usd',
    status: 'paid',
    payment_reference: 'INV-1',
    paid_at: '2026-10-01T12:00:00.000Z',
    created_at: '2026-09-01T12:00:00.000Z',
    settled_at: '2026-10-13T21:00:00.000Z',
    delivered_completions: 12,
    refund_due_cents: 54000,
    refund_method: null,
    refund_reference: null,
    refunded_cents: null,
    refunded_at: null,
    ...overrides,
  }
}

describe('StudyRefundsOwed', () => {
  it('shows an empty desk when nothing is owed', () => {
    const markup = renderToStaticMarkup(
      createElement(StudyRefundsOwed, { orders: [], brandNames: {} })
    )
    expect(markup).toContain('Refunds owed')
    expect(markup).toContain('No refunds are waiting.')
  })

  it('lists an owed row with method and reference fields', () => {
    const markup = renderToStaticMarkup(
      createElement(StudyRefundsOwed, {
        orders: [order()],
        brandNames: { 4: 'Maple' },
      })
    )
    expect(markup).toContain('Ended cocoa')
    expect(markup).toContain('Maple')
    expect(markup).toContain('$540.00 owed')
    expect(markup).toContain('12 delivered')
    expect(markup).toContain('Record refund')
    expect(markup).toContain('Refund (money back)')
    expect(markup).toContain('Credit (next study)')
  })
})
