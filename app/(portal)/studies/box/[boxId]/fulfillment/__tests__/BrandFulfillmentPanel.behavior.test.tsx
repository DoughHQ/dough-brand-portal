// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  advanceBrandFulfillmentAction: vi.fn(),
  createObjectURL: vi.fn(),
  listBrandBoxFulfillmentsAction: vi.fn(),
  revokeObjectURL: vi.fn(),
}))

vi.mock('../actions', () => ({
  advanceBrandFulfillmentAction: mocks.advanceBrandFulfillmentAction,
  listBrandBoxFulfillmentsAction: mocks.listBrandBoxFulfillmentsAction,
}))

import BrandFulfillmentPanel from '../BrandFulfillmentPanel'

function row(id: string, state: string) {
  return {
    abandon_deadline: null,
    carrier: null,
    claimed_at: null,
    completed_at: null,
    confirmed_at: null,
    consent_version: null,
    consented_at: '2026-01-01',
    delivered_at: null,
    dings_reliability: false,
    fulfillment_id: id,
    left_at: null,
    left_reason: null,
    recipient_name: `Recipient ${id}`,
    session_1_completed_at: null,
    session_2_completed_at: null,
    ship_city: 'Town',
    ship_country: 'US',
    ship_hold: null,
    ship_line1: '1 Main',
    ship_line2: null,
    ship_phone: '555',
    ship_postal: '12345',
    ship_state: 'NY',
    shipped_at: null,
    state,
    terminal_reason: null,
    tracking_ref: null,
  }
}

function success(rows: ReturnType<typeof row>[], message = 'Saved') {
  return {
    ok: true,
    rows,
    holds: {},
    addressChanges: {},
    message,
  }
}

beforeEach(() => {
  mocks.listBrandBoxFulfillmentsAction.mockReset()
  mocks.advanceBrandFulfillmentAction.mockReset()
  mocks.createObjectURL.mockReset()
  mocks.createObjectURL.mockReturnValue('blob:packing-labels')
  mocks.revokeObjectURL.mockReset()
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: mocks.createObjectURL,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: mocks.revokeObjectURL,
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('BrandFulfillmentPanel behavior', () => {
  it('ships a confirmed seat with tracking details', async () => {
    mocks.listBrandBoxFulfillmentsAction.mockResolvedValue(
      success([row('seat-1', 'confirmed')]),
    )
    mocks.advanceBrandFulfillmentAction.mockResolvedValue(
      success([row('seat-1', 'shipped')], 'Marked shipped.'),
    )
    const user = userEvent.setup()
    render(<BrandFulfillmentPanel boxId="12345678-abcd" />)

    await user.click(await screen.findByRole('button', { name: 'Mark shipped' }))
    await user.type(
      screen.getByPlaceholderText('Tracking # (optional)'),
      'TRACK-123',
    )
    await user.type(screen.getByPlaceholderText('Carrier'), 'UPS')
    await user.click(screen.getByRole('button', { name: 'Confirm shipped' }))

    expect(mocks.advanceBrandFulfillmentAction).toHaveBeenCalledWith({
      boxId: '12345678-abcd',
      fulfillmentId: 'seat-1',
      target: 'shipped',
      trackingRef: 'TRACK-123',
      carrier: 'UPS',
      reason: undefined,
    })
    expect((await screen.findByRole('status')).textContent).toContain(
      'Marked shipped.',
    )
  })

  it('requires confirmation before marking a shipped seat delivered', async () => {
    mocks.listBrandBoxFulfillmentsAction.mockResolvedValue(
      success([row('seat-2', 'shipped')]),
    )
    mocks.advanceBrandFulfillmentAction.mockResolvedValue(
      success([row('seat-2', 'delivered')], 'Marked delivered.'),
    )
    const user = userEvent.setup()
    render(<BrandFulfillmentPanel boxId="12345678-abcd" />)

    await user.click(await screen.findByRole('button', { name: 'Mark delivered' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Mark this box delivered?',
    })
    expect(mocks.advanceBrandFulfillmentAction).not.toHaveBeenCalled()
    await user.click(
      within(dialog).getByRole('button', { name: 'Mark delivered' }),
    )

    expect(mocks.advanceBrandFulfillmentAction).toHaveBeenCalledWith({
      boxId: '12345678-abcd',
      fulfillmentId: 'seat-2',
      target: 'delivered',
      trackingRef: undefined,
      carrier: undefined,
      reason: undefined,
    })
    expect((await screen.findByRole('status')).textContent).toContain(
      'Marked delivered.',
    )
  })

  it('shows an action failure and keeps the refreshed seats', async () => {
    mocks.listBrandBoxFulfillmentsAction.mockResolvedValue(
      success([row('seat-3', 'confirmed')]),
    )
    mocks.advanceBrandFulfillmentAction.mockResolvedValue({
      ok: false,
      error: 'The seat is on hold.',
      rows: [row('seat-3', 'confirmed')],
      holds: { 'seat-3': 'ALLERGEN_CONFLICT' },
      addressChanges: {},
    })
    const user = userEvent.setup()
    render(<BrandFulfillmentPanel boxId="12345678-abcd" />)

    await user.click(await screen.findByRole('button', { name: 'Mark shipped' }))
    await user.click(screen.getByRole('button', { name: 'Confirm shipped' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'The seat is on hold.',
    )
    expect(screen.getByText(/On hold/)).toBeTruthy()
  })

  it('downloads the current packing-label CSV with the box prefix', async () => {
    mocks.listBrandBoxFulfillmentsAction.mockResolvedValue(
      success([row('seat-4', 'confirmed')]),
    )
    let downloadName = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download
    })
    const user = userEvent.setup()
    render(<BrandFulfillmentPanel boxId="12345678-abcd" />)

    await user.click(await screen.findByRole('button', { name: 'Download CSV' }))

    expect(mocks.createObjectURL).toHaveBeenCalledOnce()
    expect(mocks.createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob)
    expect(downloadName).toBe('packing-labels-12345678.csv')
    await waitFor(() =>
      expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:packing-labels'),
    )
  })
})
