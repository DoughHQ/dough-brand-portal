import { createElement, type Dispatch, type SetStateAction } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PRODUCT_NAME } from '@/lib/brand'
import type { BrandApplication, CatalogCandidate } from '@/lib/brandApplications'
import BrandApplicationCard from '../BrandApplicationCard'
import type { BrandApplicationDialog } from '../brandApplicationDialog'

const setDialog: Dispatch<SetStateAction<BrandApplicationDialog>> = () => {}
const setDialogError: Dispatch<SetStateAction<string | null>> = () => {}
const setCandidateOverride: Dispatch<SetStateAction<CatalogCandidate[] | null>> = () => {}

function row(partial: Partial<BrandApplication> = {}): BrandApplication {
  return {
    waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'pending',
    brand_name_typed: 'Oat carton',
    contact_name: 'Jane Smith',
    contact_email: 'jane@newco.com',
    role_title: 'Founder',
    linkedin_url: 'javascript:alert(1)',
    brand_website: 'https://newco.example',
    site_host: 'newco.example',
    email_domain: 'gmail.com',
    domain_match: false,
    free_email: true,
    catalog_candidates: [{ brand_id: 4, brand_name: 'Maple', product_count: 2 }],
    selected_brand_id: null,
    selected_brand_name: null,
    selected_brand_product_count: null,
    already_claimed: false,
    flagged_not_mine_count: 2,
    booking_scheduled_at: null,
    created_at: '2026-10-11T12:00:00.000Z',
    reviewed_at: null,
    review_notes: null,
    alert_sent_at: null,
    alert_attempts: 2,
    alert_last_error: 'mailbox full',
    invitation: null,
    decision_email_sent_at: null,
    decision_email_attempts: 0,
    decision_email_error: null,
    ...partial,
  }
}

function card(partial: Partial<BrandApplication> = {}, impersonating = false, busy = false) {
  return renderToStaticMarkup(
    createElement(BrandApplicationCard, {
      row: row(partial),
      impersonating,
      busy,
      setDialog,
      setDialogError,
      setCandidateOverride,
    }),
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('BrandApplicationCard', () => {
  it('shows a pending net-new application before any decision', () => {
    const markup = card()

    expect(markup).toContain('opacity:1')
    expect(markup).toContain('rgba(192,120,24,0.28)')
    expect(markup).not.toContain('rgba(192,120,24,0.45)')
    expect(markup).toContain('href="mailto:jane%40newco.com"')
    expect(markup).toContain('>javascript:alert(1)<')
    expect(markup).not.toContain('href="javascript:alert(1)"')
    expect(markup).toContain('href="https://newco.example/"')
    expect(markup).toContain('Alert failing (2/5)')
    expect(markup).toContain('Flagged 2 products as not theirs')
    expect(markup).toContain('Possible catalog match: Maple (2 products)')
    expect(markup).toContain('They didn’t match an existing brand.')
    expect(markup).not.toContain('Already claimed')
    expect(markup).not.toContain('Review notes:')
    expect(markup).not.toContain('>Resend invite<')
    expect(markup).toContain('>Approve &amp; invite<')
    expect(markup).toContain('>Reject<')
    expectOrder(markup, [
      'Jane Smith',
      'jane@newco.com',
      ' · Founder',
      'Email domain ≠ website',
      'Personal email',
      'Pending',
      'Applied Oct 11, 2026 · 12:00 PM UTC',
      'Net-new brand',
      'Brand',
      'Oat carton',
      `Products on ${PRODUCT_NAME}`,
      'LinkedIn',
      'Website',
      'Call booked',
      'Not booked',
      'Approve &amp; invite',
      'Reject',
    ])
  })

  it('treats an already-claimed invited brand as a second employee', () => {
    const markup = card({
      status: 'invited',
      domain_match: true,
      free_email: false,
      catalog_candidates: [],
      flagged_not_mine_count: 0,
      selected_brand_id: 9,
      selected_brand_name: 'Maple',
      selected_brand_product_count: 3,
      already_claimed: true,
      linkedin_url: null,
      brand_website: null,
      reviewed_at: '2026-10-11T12:05:00.000Z',
      review_notes: 'Call went well',
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
    })

    expect(markup).toContain('opacity:0.78')
    expect(markup).toContain('rgba(192,120,24,0.45)')
    expect(markup).toContain('Email matches website')
    expect(markup).toContain('Invited · sent')
    expect(markup).toContain('Reviewed Oct 11, 2026 · 12:05 PM UTC')
    expect(markup).toContain('Already claimed')
    expect(markup).toContain('second-employee request')
    expect(markup).not.toContain('They didn’t match an existing brand.')
    expect(markup).toContain('· #9')
    expect(markup).toContain('Typed as “Oat carton”')
    expect(markup).toContain('>3<')
    expect(markup).toContain('Review notes:')
    expect(markup).toContain('Call went well')
    expect(markup).toContain('<span>—</span>')
    expect(markup).not.toContain('>Approve &amp; invite<')
    expectOrder(markup, ['Resend invite', 'Revoke'])
  })

  it('hides review buttons while impersonating and after the invite is accepted', () => {
    const impersonating = card({}, true)
    expect(impersonating).not.toContain('>Approve &amp; invite<')
    expect(impersonating).not.toContain('>Reject<')
    expect(impersonating).toContain('Jane Smith')

    const joined = card({
      status: 'invited',
      selected_brand_id: 9,
      selected_brand_name: 'Maple',
      invitation: {
        invitation_id: 'inv-1',
        invited_email: 'jane@newco.com',
        brand_id: 9,
        status: 'accepted',
        sent_at: '2026-10-11T12:05:00.000Z',
        send_attempts: 1,
        last_send_error: null,
        expires_at: null,
        accepted_at: '2026-10-12T12:00:00.000Z',
        revoked_at: null,
        created_at: '2026-10-11T12:05:00.000Z',
      },
    })
    expect(joined).toContain('Joined')
    expect(joined).not.toContain('>Resend invite<')
    expect(joined).not.toContain('>Revoke<')
  })

  it('dims the decision buttons while that application is busy', () => {
    const markup = card({}, false, true)
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('opacity:0.55')
    expect(markup).toContain('cursor:default')
  })
})
