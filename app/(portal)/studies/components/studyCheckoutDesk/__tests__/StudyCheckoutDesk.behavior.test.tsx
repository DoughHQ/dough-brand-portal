// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudyOrderRow } from '@/lib/checkout/payment'

const mocks = vi.hoisted(() => ({
  recordStudyPaymentAction: vi.fn(),
  setStudyPriceAction: vi.fn(),
}))

vi.mock('../../../checkoutActions', () => ({
  recordStudyPaymentAction: mocks.recordStudyPaymentAction,
  setStudyPriceAction: mocks.setStudyPriceAction,
}))

import StudyCheckoutDesk from '../../StudyCheckoutDesk'
import StudyCheckoutPriceForm from '../StudyCheckoutPriceForm'

function order(overrides: Partial<StudyOrderRow> = {}): StudyOrderRow {
  return {
    mission_id: 'mission-1',
    brand_id: 7,
    title: 'Oat carton order',
    completions: 1,
    unit_price_cents: 400,
    amount_cents: 400,
    currency: 'usd',
    status: 'awaiting_payment',
    payment_reference: null,
    paid_at: null,
    created_at: '2026-02-01T15:00:00.000Z',
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

function renderDesk(currentOrder = order()) {
  render(
    <StudyCheckoutDesk
      orders={[currentOrder]}
      brandNames={{ 7: 'Maple' }}
      invoiceContactLabels={{ 'mission-1': 'ada@example.com' }}
      unitPriceCents={400}
      currency="usd"
    />,
  )
}

beforeEach(() => {
  mocks.recordStudyPaymentAction.mockReset()
  mocks.recordStudyPaymentAction.mockResolvedValue({
    ok: true,
    alreadyRecorded: false,
  })
  mocks.setStudyPriceAction.mockReset()
  mocks.setStudyPriceAction.mockResolvedValue({ ok: true })
})

afterEach(cleanup)

describe('StudyCheckoutDesk behavior', () => {
  it('rejects a payment amount that does not match the order', async () => {
    const user = userEvent.setup()
    renderDesk()

    await user.type(screen.getByRole('textbox', { name: 'Reference' }), 'invoice-1')
    const amount = screen.getByRole('textbox', { name: 'Amount' })
    await user.clear(amount)
    await user.type(amount, '5.00')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(
      await screen.findByText('That amount does not match the order.'),
    ).toBeTruthy()
    expect(mocks.recordStudyPaymentAction).not.toHaveBeenCalled()
  })

  it('records a matching payment and reports an already-recorded order', async () => {
    const user = userEvent.setup()
    renderDesk()

    await user.type(screen.getByRole('textbox', { name: 'Reference' }), 'invoice-1')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(mocks.recordStudyPaymentAction).toHaveBeenCalledWith({
      missionId: 'mission-1',
      reference: 'invoice-1',
      waived: false,
      amountCents: 400,
      currency: 'usd',
    })
    expect(await screen.findByText('Payment recorded.')).toBeTruthy()

    cleanup()
    mocks.recordStudyPaymentAction.mockResolvedValue({
      ok: true,
      alreadyRecorded: true,
    })
    renderDesk()
    await user.type(screen.getByRole('textbox', { name: 'Reference' }), 'invoice-2')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))
    expect(await screen.findByText('Already recorded.')).toBeTruthy()
  })

  it('waives a design partner for the full order amount', async () => {
    const user = userEvent.setup()
    renderDesk()

    await user.type(screen.getByRole('textbox', { name: 'Reference' }), 'partner')
    await user.click(
      screen.getByRole('checkbox', { name: 'Waive (design partner)' }),
    )
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(mocks.recordStudyPaymentAction).toHaveBeenCalledWith({
      missionId: 'mission-1',
      reference: 'partner',
      waived: true,
      amountCents: 400,
      currency: 'usd',
    })
    expect(await screen.findByText('Waived.')).toBeTruthy()
  })

  it('saves a new concept-study price', async () => {
    const user = userEvent.setup()
    render(<StudyCheckoutPriceForm unitPriceCents={400} currency="usd" />)

    const price = screen.getByRole('textbox', {
      name: 'New price per completed response',
    })
    await user.clear(price)
    await user.type(price, '5.25')
    await user.click(screen.getByRole('button', { name: 'Change price' }))

    expect(mocks.setStudyPriceAction).toHaveBeenCalledWith({ dollars: '5.25' })
    await waitFor(() =>
      expect(
        screen.getByText('Saved. This applies to new orders only.'),
      ).toBeTruthy(),
    )
  })
})
