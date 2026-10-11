import { describe, expect, it, vi } from 'vitest'
import {
  applicationChip,
  asApplicationRow,
  describeDecisionResult,
  extractApplications,
  formatProductCount,
  friendlyBrandApplicationsError,
  listBrandWaitlistApplicationsPage,
  safeLinkedInHref,
  safeWebHref,
  sortApplicationsForQueue,
  type BrandApplication,
} from '../brandApplications'

function row(partial: Partial<BrandApplication> = {}): BrandApplication {
  return {
    waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'pending',
    brand_name_typed: 'Hershey',
    contact_name: 'Jane Smith',
    contact_email: 'jane@hershey.com',
    role_title: 'Brand manager',
    linkedin_url: 'https://www.linkedin.com/in/jane',
    brand_website: null,
    site_host: null,
    email_domain: null,
    domain_match: null,
    free_email: false,
    catalog_candidates: [],
    selected_brand_id: 2001,
    selected_brand_name: 'The Hershey Company',
    selected_brand_product_count: 1570,
    already_claimed: false,
    flagged_not_mine_count: 0,
    booking_scheduled_at: null,
    created_at: '2026-09-03T16:00:00.000Z',
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

describe('asApplicationRow', () => {
  it('parses a complete RPC row', () => {
    const parsed = asApplicationRow({
      waitlist_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      status: 'pending',
      brand_name_typed: 'Hershey',
      contact_name: 'Jane Smith',
      contact_email: 'jane@hershey.com',
      role_title: 'CMO',
      linkedin_url: 'https://linkedin.com/in/jane',
      brand_website: 'https://www.hersheys.com',
      site_host: 'hersheys.com',
      email_domain: 'hershey.com',
      domain_match: false,
      free_email: false,
      catalog_candidates: [],
      selected_brand_id: 9,
      selected_brand_name: 'The Hershey Company',
      selected_brand_product_count: 1570,
      already_claimed: true,
      flagged_not_mine_count: 3,
      booking_scheduled_at: '2026-09-10T14:00:00.000Z',
      created_at: '2026-09-03T16:00:00.000Z',
      reviewed_at: null,
      review_notes: null,
      alert_sent_at: '2026-09-03T16:01:00.000Z',
      alert_attempts: 1,
      alert_last_error: null,
    })
    expect(parsed?.selected_brand_id).toBe(9)
    expect(parsed?.already_claimed).toBe(true)
    expect(parsed?.flagged_not_mine_count).toBe(3)
    expect(parsed?.brand_website).toBe('https://www.hersheys.com')
    expect(parsed?.domain_match).toBe(false)
    expect(parsed?.alert_sent_at).toBe('2026-09-03T16:01:00.000Z')
  })

  it('defaults new advisory fields when Migration A keys are absent', () => {
    const parsed = asApplicationRow({
      waitlist_id: 'd',
      status: 'pending',
      brand_name_typed: 'Hershey',
      contact_name: 'Jane',
      contact_email: 'j@h.com',
      created_at: '2026-09-03T16:00:00.000Z',
    })
    expect(parsed?.brand_website).toBeNull()
    expect(parsed?.domain_match).toBeNull()
    expect(parsed?.free_email).toBe(false)
    expect(parsed?.catalog_candidates).toEqual([])
    expect(parsed?.alert_attempts).toBe(0)
    expect(parsed?.alert_last_error).toBeNull()
  })

  it('parses catalog_candidates and free_email', () => {
    const parsed = asApplicationRow({
      waitlist_id: 'e',
      status: 'pending',
      brand_name_typed: 'New Co',
      contact_name: 'A',
      contact_email: 'a@gmail.com',
      created_at: '2026-09-03T16:00:00.000Z',
      free_email: true,
      domain_match: true,
      catalog_candidates: [
        { brand_id: 1, brand_name: 'Newco Foods', product_count: 12 },
        { brand_id: 'bad' },
      ],
    })
    expect(parsed?.free_email).toBe(true)
    expect(parsed?.domain_match).toBe(true)
    expect(parsed?.catalog_candidates).toEqual([
      { brand_id: 1, brand_name: 'Newco Foods', product_count: 12 },
    ])
  })

  it('parses reviewed_at and review_notes on decided rows', () => {
    const parsed = asApplicationRow({
      waitlist_id: 'd',
      status: 'approved',
      brand_name_typed: 'Hershey',
      contact_name: 'Jane',
      contact_email: 'j@h.com',
      created_at: '2026-09-03T16:00:00.000Z',
      reviewed_at: '2026-09-04T12:00:00.000Z',
      review_notes: 'Solid fit',
    })
    expect(parsed?.status).toBe('approved')
    expect(parsed?.reviewed_at).toBe('2026-09-04T12:00:00.000Z')
    expect(parsed?.review_notes).toBe('Solid fit')
  })

  it('treats net-new product count as null, never 0', () => {
    const parsed = asApplicationRow({
      waitlist_id: 'c',
      status: 'pending',
      brand_name_typed: 'New Co',
      contact_name: 'A',
      contact_email: 'a@b.com',
      selected_brand_id: null,
      selected_brand_product_count: 0,
      already_claimed: true,
      flagged_not_mine_count: 0,
      created_at: '2026-09-03T16:00:00.000Z',
    })
    expect(parsed?.selected_brand_id).toBeNull()
    expect(parsed?.selected_brand_product_count).toBeNull()
    expect(parsed?.already_claimed).toBe(false)
    expect(formatProductCount(parsed!)).toBe('—')
  })

  it('drops rows without waitlist_id or contact', () => {
    expect(asApplicationRow({ contact_name: 'A', contact_email: 'a@b.com' })).toBeNull()
    expect(
      asApplicationRow({
        waitlist_id: 'x',
        contact_name: '',
        contact_email: 'a@b.com',
        created_at: '2026-09-03T16:00:00.000Z',
      })
    ).toBeNull()
  })
})

describe('extractApplications', () => {
  it('prefers items, then applications, then a bare array', () => {
    expect(
      extractApplications({
        items: [{ waitlist_id: '1' }],
        applications: [{ waitlist_id: 'legacy' }],
        has_more: false,
        next_cursor: null,
      })
    ).toEqual([{ waitlist_id: '1' }])
    expect(extractApplications({ ok: true, count: 1, applications: [{ waitlist_id: '1' }] })).toHaveLength(
      1
    )
    expect(extractApplications([{ waitlist_id: '1' }])).toHaveLength(1)
    expect(extractApplications({ ok: true, count: 0 })).toEqual([])
  })
})

describe('listBrandWaitlistApplicationsPage', () => {
  it('parses the live { items, has_more, next_cursor } envelope', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            status: 'pending',
            brand_name_typed: 'Hershey',
            contact_name: 'Jane',
            contact_email: 'jane@hershey.com',
            created_at: '2026-09-03T16:00:00.000Z',
            selected_brand_id: 9,
            selected_brand_name: 'The Hershey Company',
            selected_brand_product_count: 10,
            already_claimed: false,
            flagged_not_mine_count: 0,
          },
        ],
        has_more: false,
        next_cursor: null,
      },
      error: null,
    })

    const page = await listBrandWaitlistApplicationsPage({ rpc } as never)
    expect(rpc).toHaveBeenCalledOnce()
    expect(page.rows).toHaveLength(1)
    expect(page.rows[0].waitlist_id).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    expect(page.hasMore).toBe(false)
    expect(page.nextCursor).toBeNull()
  })
})

describe('sortApplicationsForQueue', () => {
  it('surfaces pending above resolved, newest within each group', () => {
    const sorted = sortApplicationsForQueue([
      row({ waitlist_id: 'old-pending', status: 'pending', created_at: '2026-09-01T00:00:00.000Z' }),
      row({ waitlist_id: 'new-approved', status: 'approved', created_at: '2026-09-04T00:00:00.000Z' }),
      row({ waitlist_id: 'new-pending', status: 'pending', created_at: '2026-09-03T00:00:00.000Z' }),
      row({ waitlist_id: 'rejected', status: 'rejected', created_at: '2026-09-02T00:00:00.000Z' }),
    ])
    expect(sorted.map((r) => r.waitlist_id)).toEqual([
      'new-pending',
      'old-pending',
      'new-approved',
      'rejected',
    ])
  })
})

describe('safeLinkedInHref / safeWebHref', () => {
  it('accepts http(s), prepends https, rejects javascript', () => {
    expect(safeLinkedInHref('https://www.linkedin.com/in/jane')).toBe(
      'https://www.linkedin.com/in/jane'
    )
    expect(safeLinkedInHref('linkedin.com/in/jane')).toBe('https://linkedin.com/in/jane')
    expect(safeLinkedInHref('javascript:alert(1)')).toBe(null)
    expect(safeLinkedInHref('not a url')).toBe(null)
    expect(safeWebHref('drinkwinstreak.com')).toBe('https://drinkwinstreak.com/')
    expect(safeWebHref('javascript:alert(1)')).toBe(null)
  })
})

describe('friendlyBrandApplicationsError', () => {
  it('maps the RPC space-separated not authorized token', () => {
    expect(friendlyBrandApplicationsError('not authorized')).toMatch(/permission/i)
    expect(friendlyBrandApplicationsError('42501')).toMatch(/permission/i)
    expect(friendlyBrandApplicationsError('invites_disabled')).toMatch(/switched off/i)
  })
})

describe('describeDecisionResult', () => {
  it('maps every refusal code to copy and close/refresh behaviour', () => {
    expect(describeDecisionResult('not_found')).toEqual({
      message: 'This application is no longer in the queue.',
      tone: 'info',
      closeAndRefresh: true,
    })

    for (const code of [
      'not_pending',
      'not_invited',
      'not_rejectable',
      'already_accepted',
    ] as const) {
      const d = describeDecisionResult(code)
      expect(d.closeAndRefresh).toBe(true)
      expect(d.message).toMatch(/already decided/i)
    }

    expect(describeDecisionResult('already_invited')).toMatchObject({
      closeAndRefresh: true,
      message: expect.stringMatching(/already pending/i),
    })

    expect(
      describeDecisionResult('possible_duplicate', { hasCandidates: true })
    ).toMatchObject({
      closeAndRefresh: false,
      tone: 'warn',
      message: expect.stringMatching(/Pick the brand/i),
    })
    expect(
      describeDecisionResult('possible_duplicate', { hasCandidates: false })
    ).toMatchObject({
      closeAndRefresh: false,
      message: expect.stringMatching(/Refresh and try again/i),
    })

    expect(describeDecisionResult('brand_not_active').message).toMatch(/isn’t active/i)
    expect(describeDecisionResult('brand_already_has_admin').message).toMatch(
      /already has an admin/i
    )

    const pending = describeDecisionResult('brand_has_pending_invite', {
      invitedEmail: 'alex@brand.com',
    })
    expect(pending.message).toMatch(/^alex@brand\.com already has a pending invite/)
    expect(pending.closeAndRefresh).toBe(false)

    expect(describeDecisionResult('invalid_brand_name').message).toMatch(/1–200/)
    expect(describeDecisionResult('invalid_body').message).toMatch(/Couldn’t prepare/)
    expect(describeDecisionResult('invalid_waitlist_id').message).toMatch(/Couldn’t prepare/)
    expect(describeDecisionResult('invalid_token_hash').message).toMatch(/Couldn’t prepare/)

    expect(describeDecisionResult('rpc_failed').message).toMatch(/wasn’t saved/)
    expect(describeDecisionResult('misconfigured').message).toMatch(/wasn’t saved/)
    // Bare 5xx without an edge code is ambiguous — do not claim nothing changed.
    expect(describeDecisionResult('unknown', { httpStatus: 502 }).message).toMatch(
      /Couldn’t confirm whether it went through/i
    )
    expect(describeDecisionResult('boom', { httpStatus: 500 }).message).toMatch(
      /Couldn’t confirm whether it went through/i
    )

    expect(describeDecisionResult('401').message).toMatch(/session expired/i)
    expect(describeDecisionResult('x', { httpStatus: 401 }).message).toMatch(/session expired/i)

    expect(describeDecisionResult('not_authorized').message).toMatch(/permission/i)
    expect(describeDecisionResult('impersonating').message).toMatch(/stop impersonating/i)
    expect(describeDecisionResult('impersonation').message).toMatch(/stop impersonating/i)
    expect(describeDecisionResult('invites_disabled').message).toMatch(/switched off/i)

    expect(describeDecisionResult('mystery_code')).toMatchObject({
      closeAndRefresh: false,
      message: expect.stringMatching(/Couldn’t confirm whether it went through/i),
    })
  })
})

describe('applicationChip', () => {
  it('covers pending / invited / rejected chip table', () => {
    expect(applicationChip(row()).label).toBe('Pending')

    expect(
      applicationChip(
        row({
          status: 'invited',
          invitation: {
            invitation_id: 'i1',
            invited_email: 'jane@hershey.com',
            brand_id: 1,
            status: 'pending',
            sent_at: '2026-10-11T12:00:00.000Z',
            send_attempts: 1,
            last_send_error: null,
            expires_at: '2026-10-18T12:00:00.000Z',
            accepted_at: null,
            revoked_at: null,
            created_at: '2026-10-11T12:00:00.000Z',
          },
        })
      ).label
    ).toMatch(/^Invited · sent/)

    expect(
      applicationChip(
        row({
          status: 'invited',
          invitation: {
            invitation_id: 'i2',
            invited_email: 'jane@hershey.com',
            brand_id: 1,
            status: 'pending',
            sent_at: null,
            send_attempts: 1,
            last_send_error: 'boom',
            expires_at: null,
            accepted_at: null,
            revoked_at: null,
            created_at: '2026-10-11T12:00:00.000Z',
          },
        })
      )
    ).toEqual({ label: 'Invited · email failed', tone: 'amber' })

    expect(
      applicationChip(
        row({
          status: 'invited',
          invitation: {
            invitation_id: 'i3',
            invited_email: 'jane@hershey.com',
            brand_id: 1,
            status: 'pending',
            sent_at: null,
            send_attempts: 0,
            last_send_error: null,
            expires_at: null,
            accepted_at: null,
            revoked_at: null,
            created_at: '2026-10-11T12:00:00.000Z',
          },
        })
      )
    ).toEqual({ label: 'Invited · not sent', tone: 'amber' })

    expect(
      applicationChip(
        row({
          status: 'invited',
          invitation: {
            invitation_id: 'i4',
            invited_email: 'jane@hershey.com',
            brand_id: 1,
            status: 'expired',
            sent_at: '2026-10-01T12:00:00.000Z',
            send_attempts: 1,
            last_send_error: null,
            expires_at: '2026-10-08T12:00:00.000Z',
            accepted_at: null,
            revoked_at: null,
            created_at: '2026-10-01T12:00:00.000Z',
          },
        })
      )
    ).toEqual({ label: 'Invite expired', tone: 'amber' })

    expect(
      applicationChip(
        row({
          status: 'invited',
          invitation: {
            invitation_id: 'i5',
            invited_email: 'jane@hershey.com',
            brand_id: 1,
            status: 'revoked',
            sent_at: null,
            send_attempts: 0,
            last_send_error: null,
            expires_at: null,
            accepted_at: null,
            revoked_at: '2026-10-11T12:00:00.000Z',
            created_at: '2026-10-11T12:00:00.000Z',
          },
        })
      )
    ).toEqual({ label: 'Invite revoked', tone: 'ink' })

    expect(
      applicationChip(
        row({
          status: 'invited',
          invitation: {
            invitation_id: 'i6',
            invited_email: 'jane@hershey.com',
            brand_id: 1,
            status: 'accepted',
            sent_at: '2026-10-11T12:00:00.000Z',
            send_attempts: 1,
            last_send_error: null,
            expires_at: null,
            accepted_at: '2026-10-12T12:00:00.000Z',
            revoked_at: null,
            created_at: '2026-10-11T12:00:00.000Z',
          },
        })
      )
    ).toEqual({ label: 'Joined', tone: 'sage' })

    expect(
      applicationChip(
        row({
          status: 'rejected',
          decision_email_sent_at: '2026-10-11T12:00:00.000Z',
        })
      )
    ).toEqual({ label: 'Rejected · reply sent', tone: 'ink' })

    expect(
      applicationChip(
        row({
          status: 'rejected',
          decision_email_attempts: 1,
          decision_email_error: 'boom',
        })
      )
    ).toEqual({ label: 'Rejected · reply failed', tone: 'amber' })

    expect(applicationChip(row({ status: 'rejected' }))).toEqual({
      label: 'Rejected · no reply',
      tone: 'ink',
    })
  })

  it('defaults invitation fields when Migration Phase 3 keys are absent', () => {
    const parsed = asApplicationRow({
      waitlist_id: 'x',
      status: 'pending',
      brand_name_typed: 'A',
      contact_name: 'B',
      contact_email: 'b@c.com',
      created_at: '2026-09-03T16:00:00.000Z',
    })
    expect(parsed?.invitation).toBeNull()
    expect(parsed?.decision_email_attempts).toBe(0)
  })
})
