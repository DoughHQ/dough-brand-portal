// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { BrandApplication } from '@/lib/brandApplications'

const decideBrandApplicationAction = vi.fn()
const listBrandWaitlistApplicationsAction = vi.fn()

vi.mock('../actions', () => ({
  decideBrandApplicationAction: (...args: unknown[]) =>
    decideBrandApplicationAction(...args),
  listBrandWaitlistApplicationsAction: (...args: unknown[]) =>
    listBrandWaitlistApplicationsAction(...args),
}))

import BrandApplicationsClient from '../BrandApplicationsClient'

afterEach(() => {
  cleanup()
  decideBrandApplicationAction.mockReset()
  listBrandWaitlistApplicationsAction.mockReset()
})

function row(partial: Partial<BrandApplication> = {}): BrandApplication {
  return {
    waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'invited',
    brand_name_typed: 'New Co',
    contact_name: 'Jane Smith',
    contact_email: 'jane@newco.com',
    role_title: null,
    linkedin_url: null,
    brand_website: null,
    site_host: null,
    email_domain: null,
    domain_match: null,
    free_email: false,
    catalog_candidates: [],
    selected_brand_id: 9,
    selected_brand_name: 'New Co',
    selected_brand_product_count: 3,
    already_claimed: false,
    flagged_not_mine_count: 0,
    booking_scheduled_at: null,
    created_at: '2026-10-11T12:00:00.000Z',
    reviewed_at: '2026-10-11T12:05:00.000Z',
    review_notes: null,
    alert_sent_at: null,
    alert_attempts: 0,
    alert_last_error: null,
    invitation: {
      invitation_id: 'inv-1',
      invited_email: 'jane@newco.com',
      brand_id: 9,
      status: 'pending',
      sent_at: '2026-10-11T12:05:00.000Z',
      send_attempts: 1,
      last_send_error: null,
      expires_at: null,
      accepted_at: null,
      revoked_at: null,
      created_at: '2026-10-11T12:05:00.000Z',
    },
    decision_email_sent_at: null,
    decision_email_attempts: 0,
    decision_email_error: null,
    ...partial,
  }
}

describe('BrandApplicationsClient decision outcomes', () => {
  it('clears busy and shows reach-the-server copy when the action throws', async () => {
    const user = userEvent.setup()
    decideBrandApplicationAction.mockRejectedValue(new Error('network'))
    listBrandWaitlistApplicationsAction.mockResolvedValue({
      ok: true,
      rows: [row()],
      hasMore: false,
      nextCursor: null,
    })

    render(<BrandApplicationsClient initialRows={[row()]} />)

    await user.click(screen.getByRole('button', { name: /^Revoke$/i }))
    const dialog = await screen.findByRole('dialog', { name: /Revoke invite/i })
    await user.click(within(dialog).getByRole('button', { name: /^Revoke$/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/Couldn’t reach the server\. Refresh to check whether it went through\./i)
      ).toBeTruthy()
    })
    expect(screen.queryByText(/Working…/i)).toBeNull()
  })

  it('shows no-pending-invite copy when revoke returns revoked: 0', async () => {
    const user = userEvent.setup()
    decideBrandApplicationAction.mockResolvedValue({
      ok: true,
      revoked: 0,
    })
    listBrandWaitlistApplicationsAction.mockResolvedValue({
      ok: true,
      rows: [row()],
      hasMore: false,
      nextCursor: null,
    })

    render(<BrandApplicationsClient initialRows={[row()]} />)

    await user.click(screen.getByRole('button', { name: /^Revoke$/i }))
    const dialog = await screen.findByRole('dialog', { name: /Revoke invite/i })
    await user.click(within(dialog).getByRole('button', { name: /^Revoke$/i }))

    await waitFor(() => {
      expect(screen.getByText(/No pending invite to revoke\./i)).toBeTruthy()
    })
  })

  it('hides Revoke when the invite is already revoked', () => {
    render(
      <BrandApplicationsClient
        initialRows={[
          row({
            invitation: {
              invitation_id: 'inv-1',
              invited_email: 'jane@newco.com',
              brand_id: 9,
              status: 'revoked',
              sent_at: '2026-10-11T12:05:00.000Z',
              send_attempts: 1,
              last_send_error: null,
              expires_at: null,
              accepted_at: null,
              revoked_at: '2026-10-11T13:00:00.000Z',
              created_at: '2026-10-11T12:05:00.000Z',
            },
          }),
        ]}
      />
    )
    expect(screen.queryByRole('button', { name: /^Revoke$/i })).toBeNull()
  })
})
