// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApproveInviteDialog } from '../ApplicationDecisionDialogs'
import type { BrandApplication, CatalogCandidate } from '@/lib/brandApplications'

afterEach(cleanup)

function row(partial: Partial<BrandApplication> = {}): BrandApplication {
  return {
    waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'pending',
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
    selected_brand_id: null,
    selected_brand_name: null,
    selected_brand_product_count: null,
    already_claimed: false,
    flagged_not_mine_count: 0,
    booking_scheduled_at: null,
    created_at: '2026-10-11T12:00:00.000Z',
    reviewed_at: null,
    review_notes: null,
    alert_sent_at: null,
    alert_attempts: 0,
    alert_last_error: null,
    invitation: null,
    decision_email_sent_at: null,
    decision_email_attempts: 0,
    decision_email_error: null,
    ...partial,
  }
}

const candidates: CatalogCandidate[] = [
  { brand_id: 42, brand_name: 'Existing Co', product_count: 12 },
]

describe('ApproveInviteDialog', () => {
  it('clears the Create-new selection when candidateOverride arrives', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { rerender } = render(
      <ApproveInviteDialog
        row={row()}
        busy={false}
        error={null}
        candidateOverride={null}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />
    )

    const initialPrimary = screen.getByRole('button', {
      name: /Create brand & send invite/i,
    }) as HTMLButtonElement
    expect(initialPrimary.disabled).toBe(false)

    rerender(
      <ApproveInviteDialog
        row={row()}
        busy={false}
        error={null}
        candidateOverride={candidates}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />
    )

    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.every((r) => !r.checked)).toBe(true)
    const blocked = screen.getByRole('button', {
      name: /Send invite|Create brand/i,
    }) as HTMLButtonElement
    expect(blocked.disabled).toBe(true)

    await user.click(screen.getByLabelText(/Link to Existing Co/i))
    await user.click(screen.getByRole('button', { name: /Send invite/i }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ existingBrandId: 42 })
    )

    onSubmit.mockClear()
    await user.click(screen.getByLabelText(/Create new brand/i))
    await user.click(screen.getByRole('button', { name: /Create brand & send invite/i }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ confirmNew: true, brandName: 'New Co' })
    )
  })
})
