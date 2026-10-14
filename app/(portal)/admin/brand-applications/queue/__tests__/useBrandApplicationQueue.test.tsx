// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BrandApplication } from '@/lib/brandApplications'
import { useBrandApplicationQueue } from '../useBrandApplicationQueue'

const { decideBrandApplicationAction, listBrandWaitlistApplicationsAction } = vi.hoisted(() => ({
  decideBrandApplicationAction: vi.fn(),
  listBrandWaitlistApplicationsAction: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('../../actions', () => ({
  decideBrandApplicationAction,
  listBrandWaitlistApplicationsAction,
}))

function row(partial: Partial<BrandApplication> = {}): BrandApplication {
  return {
    waitlist_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'pending',
    brand_name_typed: 'Oat carton',
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function renderQueue(initialRows: BrandApplication[] = [row()], hasMore = false) {
  return renderHook(() =>
    useBrandApplicationQueue({
      initialRows,
      initialHasMore: hasMore,
      initialCursor: hasMore ? { statusRank: 0, createdAt: '2026-10-11T12:00:00.000Z', id: 'a' } : null,
    }),
  )
}

describe('useBrandApplicationQueue', () => {
  beforeEach(() => {
    decideBrandApplicationAction.mockReset()
    listBrandWaitlistApplicationsAction.mockReset()
    listBrandWaitlistApplicationsAction.mockResolvedValue({
      ok: true,
      rows: [],
      hasMore: false,
      nextCursor: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sends an invite, then clears a success banner after six seconds', async () => {
    vi.useFakeTimers()
    const applicant = row()
    decideBrandApplicationAction.mockResolvedValue({
      ok: true,
      sent: true,
      invited_email: 'ada@example.com',
    })
    const { result } = renderQueue()
    act(() => {
      result.current.setDialog({ kind: 'approve', row: applicant })
    })

    await act(async () => {
      await result.current.runDecision(applicant, {
        action: 'approve',
        waitlistId: applicant.waitlist_id,
      })
    })

    expect(result.current.dialog).toBeNull()
    expect(result.current.busyId).toBeNull()
    expect(result.current.banner).toEqual({
      message: 'Invite sent to ada@example.com.',
      tone: 'success',
    })
    expect(listBrandWaitlistApplicationsAction).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(5999)
    })
    expect(result.current.banner?.tone).toBe('success')
    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.banner).toBeNull()
  })

  it('keeps the dialog open when the brand may already be in the catalog', async () => {
    const applicant = row()
    decideBrandApplicationAction.mockResolvedValue({
      ok: false,
      code: 'possible_duplicate',
      candidates: [{ brand_id: 4, brand_name: 'Maple', product_count: 2 }],
    })
    const { result } = renderQueue()
    act(() => {
      result.current.setDialog({ kind: 'approve', row: applicant })
    })

    await act(async () => {
      await result.current.runDecision(applicant, {
        action: 'approve',
        waitlistId: applicant.waitlist_id,
      })
    })

    expect(result.current.dialog?.kind).toBe('approve')
    expect(result.current.candidateOverride).toEqual([
      { brand_id: 4, brand_name: 'Maple', product_count: 2 },
    ])
    expect(result.current.dialogError).toBe(
      'This may already be in the catalog. Pick the brand to link, or choose Create new brand.',
    )
    expect(listBrandWaitlistApplicationsAction).not.toHaveBeenCalled()
  })

  it('closes a stale review and refreshes when the server says to', async () => {
    const applicant = row()
    decideBrandApplicationAction.mockResolvedValue({
      ok: false,
      closeAndRefresh: true,
      error: 'This application is no longer in the queue.',
      tone: 'info',
    })
    const { result } = renderQueue()
    act(() => {
      result.current.setDialog({ kind: 'reject', row: applicant })
      result.current.setCandidateOverride([{ brand_id: 4, brand_name: 'Maple', product_count: 1 }])
    })

    await act(async () => {
      await result.current.runDecision(applicant, {
        action: 'reject',
        waitlistId: applicant.waitlist_id,
        sendEmail: true,
      })
    })

    expect(result.current.dialog).toBeNull()
    expect(result.current.candidateOverride).toBeNull()
    expect(result.current.banner).toEqual({
      message: 'This application is no longer in the queue.',
      tone: 'info',
    })
    expect(listBrandWaitlistApplicationsAction).toHaveBeenCalledTimes(1)
  })

  it('warns when a rejection reply does not send, and revokes a pending invite', async () => {
    const applicant = row()
    decideBrandApplicationAction.mockResolvedValueOnce({ ok: true, sent: false })
    const rejected = renderQueue()
    await act(async () => {
      await rejected.result.current.runDecision(applicant, {
        action: 'reject',
        waitlistId: applicant.waitlist_id,
        sendEmail: true,
      })
    })
    expect(rejected.result.current.banner).toEqual({
      message: 'Rejected, but the reply email didn’t send.',
      tone: 'warn',
    })

    decideBrandApplicationAction.mockResolvedValueOnce({ ok: true, revoked: 1 })
    const revoked = renderQueue()
    await act(async () => {
      await revoked.result.current.runDecision(applicant, {
        action: 'revoke',
        waitlistId: applicant.waitlist_id,
      })
    })
    expect(revoked.result.current.banner).toEqual({
      message: 'Invite revoked.',
      tone: 'success',
    })
  })

  it('refuses to close the dialog while a decision is in flight', async () => {
    const applicant = row()
    const pending = deferred<{ ok: true; sent: true }>()
    decideBrandApplicationAction.mockReturnValue(pending.promise)
    const { result } = renderQueue()
    act(() => {
      result.current.setDialog({ kind: 'approve', row: applicant })
    })
    let done!: Promise<void>
    act(() => {
      done = result.current.runDecision(applicant, {
        action: 'approve',
        waitlistId: applicant.waitlist_id,
      })
    })
    expect(result.current.busyId).toBe(applicant.waitlist_id)
    act(() => {
      result.current.closeDialog()
    })
    expect(result.current.dialog?.kind).toBe('approve')

    await act(async () => {
      pending.resolve({ ok: true, sent: true })
      await done
    })
    expect(result.current.dialog).toBeNull()
    expect(result.current.busyId).toBeNull()
  })

  it('appends a new page without repeating an application already on screen', async () => {
    const older = row({ waitlist_id: 'older', created_at: '2026-10-01T12:00:00.000Z' })
    const newer = row({
      waitlist_id: 'newer',
      contact_email: 'newer@newco.com',
      created_at: '2026-10-12T12:00:00.000Z',
    })
    listBrandWaitlistApplicationsAction.mockResolvedValue({
      ok: true,
      rows: [older, newer],
      hasMore: false,
      nextCursor: null,
    })
    const { result } = renderQueue([older], true)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.rows.map((item) => item.waitlist_id)).toEqual(['newer', 'older'])
    expect(result.current.hasMore).toBe(false)
    expect(listBrandWaitlistApplicationsAction).toHaveBeenCalledWith({
      cursor: { statusRank: 0, createdAt: '2026-10-11T12:00:00.000Z', id: 'a' },
    })
  })
})
