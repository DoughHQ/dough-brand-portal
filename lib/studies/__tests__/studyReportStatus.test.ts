import { describe, expect, it } from 'vitest'
import type { StudyEndPreview } from '../endStudy'
import { studyReportStatus } from '../studyReportStatus'

const now = new Date('2026-10-13T20:00:00.000Z')

function preview(overrides: Partial<StudyEndPreview> = {}): StudyEndPreview {
  return {
    mission_id: 'm1',
    kind: 'concept',
    status: 'active',
    can_end: true,
    caller_can_end: true,
    why_not: null,
    target: 30,
    completed: 12,
    last_completed_at: '2026-10-13T18:00:00.000Z',
    finishing: 0,
    not_started: 0,
    report_minimum: 10,
    report_if_ended_now: true,
    grace_minutes: 15,
    live_since: '2026-10-01T12:00:00.000Z',
    limit_at: '2026-12-30T12:00:00.000Z',
    order: null,
    ...overrides,
  }
}

describe('studyReportStatus', () => {
  it('describes collecting with progress and no refund promise', () => {
    const status = studyReportStatus(
      preview({
        order: {
          status: 'paid',
          completions: 30,
          unit_price_cents: 3000,
          amount_cents: 90000,
          currency: 'usd',
          refund_if_ended_now_cents: 54000,
          refund_if_everyone_finishing_finishes_cents: 54000,
          settled_at: null,
          delivered_completions: null,
          refund_due_cents: null,
          refund_method: null,
          refunded_cents: null,
          refunded_at: null,
        },
      }),
      now
    )
    expect(status.kind).toBe('collecting')
    expect(status.title).toBe('Still collecting responses')
    expect(status.body).toContain('12 of 30 responses so far, the last 2 hours ago')
    expect(status.body).toContain('Dec 30')
    expect(status.progressRatio).toBeCloseTo(12 / 30)
    expect(status.showEndStudy).toBe(true)
    expect(status.orderLine).toBeNull()
  })

  it('describes a full IHUT finishing up', () => {
    const status = studyReportStatus(
      preview({
        kind: 'ihut',
        can_end: false,
        caller_can_end: false,
        why_not: 'already_full',
        completed: 18,
        finishing: 2,
        target: 20,
      }),
      now
    )
    expect(status.kind).toBe('finishing')
    expect(status.body).toContain('18 of 20 households are done and 2 are finishing')
    expect(status.showEndStudy).toBe(false)
  })

  it('describes building for concept and IHUT', () => {
    expect(
      studyReportStatus(
        preview({
          status: 'expired',
          can_end: false,
          caller_can_end: false,
          why_not: 'already_ended',
          completed: 13,
        }),
        now
      )
    ).toMatchObject({
      kind: 'building',
      title: 'Building your report',
    })

    expect(
      studyReportStatus(
        preview({
          kind: 'ihut',
          status: 'expired',
          can_end: false,
          caller_can_end: false,
          why_not: 'already_ended',
          completed: 12,
          finishing: 2,
        }),
        now
      ).body
    ).toContain('12 households have finished and 2 are still going')
  })

  it('waits on finishers under the minimum', () => {
    const status = studyReportStatus(
      preview({
        status: 'expired',
        can_end: false,
        caller_can_end: false,
        why_not: 'already_ended',
        completed: 7,
        finishing: 2,
        report_if_ended_now: false,
      }),
      now
    )
    expect(status.kind).toBe('waiting_on_finishers')
    expect(status.body).toContain('A report needs 10')
  })

  it('explains no report and refund owed or refunded', () => {
    const owed = studyReportStatus(
      preview({
        status: 'expired',
        can_end: false,
        caller_can_end: false,
        why_not: 'already_ended',
        completed: 4,
        finishing: 0,
        report_if_ended_now: false,
        order: {
          status: 'paid',
          completions: 30,
          unit_price_cents: 3000,
          amount_cents: 90000,
          currency: 'usd',
          refund_if_ended_now_cents: null,
          refund_if_everyone_finishing_finishes_cents: null,
          settled_at: '2026-10-13T21:00:00.000Z',
          delivered_completions: 4,
          refund_due_cents: 90000,
          refund_method: null,
          refunded_cents: null,
          refunded_at: null,
        },
      }),
      now
    )
    expect(owed.kind).toBe('no_report')
    expect(owed.orderLine).toContain('$900.00 is owed back to you')

    const refunded = studyReportStatus(
      preview({
        status: 'expired',
        can_end: false,
        caller_can_end: false,
        why_not: 'already_ended',
        completed: 4,
        finishing: 0,
        order: {
          status: 'paid',
          completions: 30,
          unit_price_cents: 3000,
          amount_cents: 90000,
          currency: 'usd',
          refund_if_ended_now_cents: null,
          refund_if_everyone_finishing_finishes_cents: null,
          settled_at: '2026-10-13T21:00:00.000Z',
          delivered_completions: 4,
          refund_due_cents: 90000,
          refund_method: 'credit',
          refunded_cents: 90000,
          refunded_at: '2026-10-14T15:00:00.000Z',
        },
      }),
      now
    )
    expect(refunded.orderLine).toContain('credited toward your next study')
  })
})
