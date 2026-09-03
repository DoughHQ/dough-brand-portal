import { describe, expect, it } from 'vitest'
import {
  asApplicationRow,
  extractApplications,
  formatProductCount,
  friendlyBrandApplicationsError,
  safeLinkedInHref,
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
    selected_brand_id: 2001,
    selected_brand_name: 'The Hershey Company',
    selected_brand_product_count: 1570,
    already_claimed: false,
    flagged_not_mine_count: 0,
    booking_scheduled_at: null,
    created_at: '2026-09-03T16:00:00.000Z',
    reviewed_at: null,
    review_notes: null,
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
      selected_brand_id: 9,
      selected_brand_name: 'The Hershey Company',
      selected_brand_product_count: 1570,
      already_claimed: true,
      flagged_not_mine_count: 3,
      booking_scheduled_at: '2026-09-10T14:00:00.000Z',
      created_at: '2026-09-03T16:00:00.000Z',
      reviewed_at: null,
      review_notes: null,
    })
    expect(parsed?.selected_brand_id).toBe(9)
    expect(parsed?.already_claimed).toBe(true)
    expect(parsed?.flagged_not_mine_count).toBe(3)
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
  it('reads the { applications } envelope, not a bare array first', () => {
    expect(extractApplications({ ok: true, count: 1, applications: [{ waitlist_id: '1' }] })).toHaveLength(1)
    expect(extractApplications([{ waitlist_id: '1' }])).toHaveLength(1)
    expect(extractApplications({ ok: true, count: 0 })).toEqual([])
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

describe('safeLinkedInHref', () => {
  it('accepts http(s), prepends https, rejects javascript', () => {
    expect(safeLinkedInHref('https://www.linkedin.com/in/jane')).toBe(
      'https://www.linkedin.com/in/jane'
    )
    expect(safeLinkedInHref('linkedin.com/in/jane')).toBe('https://linkedin.com/in/jane')
    expect(safeLinkedInHref('javascript:alert(1)')).toBe(null)
    expect(safeLinkedInHref('not a url')).toBe(null)
  })
})

describe('friendlyBrandApplicationsError', () => {
  it('maps the RPC space-separated not authorized token', () => {
    expect(friendlyBrandApplicationsError('not authorized')).toMatch(/permission/i)
    expect(friendlyBrandApplicationsError('42501')).toMatch(/permission/i)
  })
})
