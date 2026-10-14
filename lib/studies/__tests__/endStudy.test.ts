import { describe, expect, it } from 'vitest'
import {
  endStudyDialogLines,
  endStudyErrorMessage,
  endStudySuccessToast,
  parseEndStudyResult,
  parseStudyEndPreview,
  type StudyEndPreview,
} from '../endStudy'

const now = new Date('2026-10-13T20:00:00.000Z')

function basePreview(overrides: Partial<StudyEndPreview> = {}): StudyEndPreview {
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
    finishing: 2,
    not_started: 2,
    report_minimum: 10,
    report_if_ended_now: true,
    grace_minutes: 15,
    live_since: '2026-10-01T12:00:00.000Z',
    limit_at: '2026-12-30T12:00:00.000Z',
    order: {
      status: 'paid',
      completions: 30,
      unit_price_cents: 3000,
      amount_cents: 90000,
      currency: 'usd',
      refund_if_ended_now_cents: 54000,
      refund_if_everyone_finishing_finishes_cents: 48000,
      settled_at: null,
      delivered_completions: null,
      refund_due_cents: null,
      refund_method: null,
      refunded_cents: null,
      refunded_at: null,
    },
    ...overrides,
  }
}

describe('parseStudyEndPreview', () => {
  it('parses a valid preview', () => {
    const preview = parseStudyEndPreview(basePreview())
    expect(preview?.completed).toBe(12)
    expect(preview?.order?.refund_if_ended_now_cents).toBe(54000)
  })

  it('accepts numeric strings and a null order', () => {
    const preview = parseStudyEndPreview({
      ...basePreview({ order: null, target: null }),
      completed: '4',
      finishing: '0',
      not_started: '1',
      report_minimum: '10',
      grace_minutes: '15',
    })
    expect(preview).toMatchObject({
      completed: 4,
      finishing: 0,
      not_started: 1,
      target: null,
      order: null,
    })
  })

  it('rejects malformed shapes', () => {
    expect(parseStudyEndPreview(null)).toBeNull()
    expect(parseStudyEndPreview({ ...basePreview(), kind: 'box' })).toBeNull()
    expect(
      parseStudyEndPreview({
        ...basePreview(),
        order: { status: 'paid', completions: 'nope' },
      })
    ).toBeNull()
  })
})

describe('parseEndStudyResult', () => {
  it('parses ended, already_ended, and already_full', () => {
    expect(
      parseEndStudyResult({
        ended: true,
        mission_id: 'm1',
        kind: 'concept',
        status: 'expired',
        reason: 'ended_by_brand',
        ended_at: '2026-10-13T20:00:00.000Z',
        completed: 12,
        target: 30,
        released: 2,
        finishing: 2,
        finish_by: '2026-10-13T20:15:00.000Z',
      })
    ).toMatchObject({ outcome: 'ended', released: 2, finishing: 2 })

    expect(
      parseEndStudyResult({
        ended: false,
        already_ended: true,
        mission_id: 'm1',
        kind: 'concept',
        status: 'expired',
        completed: 12,
        target: 30,
      })
    ).toMatchObject({ outcome: 'already_ended' })

    expect(
      parseEndStudyResult({
        ended: false,
        already_full: true,
        mission_id: 'm1',
        kind: 'ihut',
        status: 'active',
        completed: 20,
        target: 20,
      })
    ).toMatchObject({ outcome: 'already_full' })
  })

  it('rejects unknown end payloads', () => {
    expect(parseEndStudyResult({ ended: true, status: 'active' })).toBeNull()
  })
})

describe('endStudyErrorMessage', () => {
  it('maps every known hint', () => {
    expect(endStudyErrorMessage({ hint: 'MISSIONS_WRITE_REQUIRED' })).toContain(
      'not end them'
    )
    expect(endStudyErrorMessage({ hint: 'CROSS_TENANT_ACCESS_DENIED' })).toContain(
      "don't have access"
    )
    expect(endStudyErrorMessage({ hint: 'NOT_A_BRAND_PORTAL_USER' })).toContain(
      "don't have access"
    )
    expect(endStudyErrorMessage({ hint: 'MISSION_HAS_NO_OWNING_BRAND' })).toContain(
      "don't have access"
    )
    expect(endStudyErrorMessage({ hint: 'NOT_AUTHENTICATED' })).toContain('Sign in again')
    expect(endStudyErrorMessage({ hint: 'NOT_RUNNING' })).toContain("hasn't gone live")
    expect(endStudyErrorMessage({ hint: 'MISSION_NOT_FOUND' })).toContain('no longer there')
    expect(endStudyErrorMessage({ message: 'NOT_RUNNING: draft' })).toContain(
      "hasn't gone live"
    )
    expect(endStudyErrorMessage({ message: '' })).toBe('Something went wrong. Try again.')
  })
})

describe('endStudyDialogLines', () => {
  it('builds concept copy with partway respondents and both refund amounts', () => {
    const model = endStudyDialogLines(basePreview(), 'Midnight Cocoa', now)
    expect(model.canConfirm).toBe(true)
    expect(model.title).toBe('End “Midnight Cocoa”?')
    expect(model.lines[0]).toBe('12 of 30 responses are in, the last 2 hours ago')
    expect(model.lines).toContain(
      '2 people are partway through. They get 15 minutes to finish.'
    )
    expect(model.lines).toContain(
      "2 people who signed up but haven't started won't be able to."
    )
    expect(model.lines).toContain("You'll get a report on everyone who finishes.")
    expect(model.lines).toContain(
      '$540.00 comes back to you for the responses not delivered.'
    )
    expect(model.lines).toContain('If everyone finishing completes, it\'s $480.00.')
    expect(model.lines).toContain('Runoff sends it once the study\'s report is final.')
    expect(model.lines.at(-1)).toBe("Ending can't be undone.")
  })

  it('explains a full refund when no report is possible', () => {
    const model = endStudyDialogLines(
      basePreview({
        completed: 3,
        finishing: 1,
        not_started: 0,
        report_if_ended_now: false,
        last_completed_at: null,
        order: {
          ...basePreview().order!,
          refund_if_ended_now_cents: 90000,
          refund_if_everyone_finishing_finishes_cents: 90000,
        },
      }),
      'Short run',
      now
    )
    expect(model.lines).toContain(
      'A report needs 10 responses, so there won\'t be one.'
    )
    expect(model.lines).toContain(
      'The full $900.00 comes back to you, since there won\'t be a report.'
    )
  })

  it('builds IHUT copy with finishing households and released places', () => {
    const model = endStudyDialogLines(
      basePreview({
        kind: 'ihut',
        completed: 8,
        finishing: 3,
        not_started: 2,
        report_if_ended_now: false,
        order: null,
        last_completed_at: null,
      }),
      'Garlic IHUT',
      now
    )
    expect(model.lines).toContain(
      '3 households have a box on the way or in hand. They finish on their own deadlines, and the report waits for them.'
    )
    expect(model.lines).toContain('2 places nobody confirmed are released.')
    expect(model.lines).toContain(
      "A report needs 10 responses. You'll get one only if enough of the people finishing complete."
    )
    expect(model.lines.every((line) => !line.includes('comes back'))).toBe(true)
  })

  it('omits refund lines when waived', () => {
    const model = endStudyDialogLines(
      basePreview({
        order: {
          ...basePreview().order!,
          status: 'waived',
          refund_if_ended_now_cents: 0,
          refund_if_everyone_finishing_finishes_cents: 0,
        },
      }),
      'Partner study',
      now
    )
    expect(model.lines.every((line) => !line.includes('comes back'))).toBe(true)
  })

  it('covers each cannot-end reason and viewers', () => {
    expect(
      endStudyDialogLines(
        basePreview({
          can_end: false,
          caller_can_end: false,
          why_not: 'already_ended',
        }),
        'Done',
        now
      ).blockedReason
    ).toBe('This study has already ended.')

    expect(
      endStudyDialogLines(
        basePreview({
          can_end: false,
          caller_can_end: false,
          why_not: 'already_full',
        }),
        'Full',
        now
      ).blockedReason
    ).toContain('full')

    expect(
      endStudyDialogLines(
        basePreview({
          can_end: false,
          caller_can_end: false,
          why_not: 'not_live',
        }),
        'Draft',
        now
      ).blockedReason
    ).toContain("hasn't gone live")

    expect(
      endStudyDialogLines(
        basePreview({
          can_end: true,
          caller_can_end: false,
          why_not: null,
        }),
        'Viewer',
        now
      ).blockedReason
    ).toBe('Only brand admins can end a study.')
  })

  it('handles other kind and no target', () => {
    const model = endStudyDialogLines(
      basePreview({
        kind: 'other',
        target: null,
        finishing: 1,
        not_started: 1,
        order: null,
        last_completed_at: null,
      }),
      'Other study',
      now
    )
    expect(model.lines[0]).toBe('12 responses are in')
    expect(model.lines).toContain('1 participant is still finishing.')
    expect(model.lines).toContain('1 unstarted place is released.')
  })
})

describe('endStudySuccessToast', () => {
  it('uses kind-aware success and no-op copy', () => {
    expect(
      endStudySuccessToast({
        outcome: 'ended',
        mission_id: 'm1',
        kind: 'concept',
        status: 'expired',
        reason: 'ended_by_brand',
        ended_at: '2026-10-13T20:00:00.000Z',
        completed: 12,
        target: 30,
        released: 2,
        finishing: 2,
        finish_by: '2026-10-13T20:15:00.000Z',
      })
    ).toContain('4:15')

    expect(
      endStudySuccessToast({
        outcome: 'ended',
        mission_id: 'm1',
        kind: 'ihut',
        status: 'expired',
        reason: 'ended_by_brand',
        ended_at: '2026-10-13T20:00:00.000Z',
        completed: 3,
        target: 20,
        released: 2,
        finishing: 3,
        finish_by: null,
      })
    ).toContain('Households with a box')

    expect(
      endStudySuccessToast({
        outcome: 'already_ended',
        mission_id: 'm1',
        kind: 'concept',
        status: 'expired',
        completed: 12,
        target: 30,
      })
    ).toBe('This study has already ended.')
  })
})
