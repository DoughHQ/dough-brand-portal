import { PRODUCT_NAME } from '@/lib/brand'
import { formatOrderMoney } from '@/lib/checkout/money'
import type { EndStudyResult, StudyEndPreview } from './endStudy'

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

function relativeAgo(iso: string, now: Date): string | null {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const ms = Math.max(0, now.getTime() - then.getTime())
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s} ${s === 1 ? 'second' : 'seconds'} ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h} ${h === 1 ? 'hour' : 'hours'} ago`
  const d = Math.floor(h / 24)
  return `${d} ${d === 1 ? 'day' : 'days'} ago`
}

export function formatEasternDate(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(date)
}

export function formatEasternTime(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }).format(date)
}

export type EndStudyDialogModel = {
  title: string
  loading: boolean
  lines: string[]
  canConfirm: boolean
  confirmLabel: string
  cancelLabel: string
  blockedReason: string | null
}

function responsesInLine(preview: StudyEndPreview, now: Date): string {
  const relative =
    preview.last_completed_at != null
      ? relativeAgo(preview.last_completed_at, now)
      : null
  const suffix = relative ? `, the last ${relative}` : ''
  if (preview.target != null) {
    return `${preview.completed} of ${preview.target} responses are in${suffix}`
  }
  return `${plural(preview.completed, 'response is', 'responses are')} in${suffix}`
}

function reportLines(preview: StudyEndPreview): string[] {
  if (preview.report_if_ended_now) {
    return ["You'll get a report on everyone who finishes."]
  }
  if (preview.completed + preview.finishing >= preview.report_minimum) {
    return [
      `A report needs ${preview.report_minimum} responses. You'll get one only if enough of the people finishing complete.`,
    ]
  }
  return [
    `A report needs ${preview.report_minimum} responses, so there won't be one.`,
  ]
}

function refundLines(preview: StudyEndPreview): string[] {
  const order = preview.order
  if (!order || order.status !== 'paid') return []

  const nowCents = order.refund_if_ended_now_cents
  const finishCents = order.refund_if_everyone_finishing_finishes_cents
  if (nowCents == null || nowCents <= 0) return []

  const lines: string[] = []
  const reportPossible =
    preview.report_if_ended_now ||
    preview.completed + preview.finishing >= preview.report_minimum

  if (reportPossible) {
    lines.push(
      `${formatOrderMoney(nowCents, order.currency)} comes back to you for the responses not delivered.`
    )
    if (finishCents != null && finishCents !== nowCents) {
      lines.push(
        `If everyone finishing completes, it's ${formatOrderMoney(finishCents, order.currency)}.`
      )
    }
  } else {
    lines.push(
      `The full ${formatOrderMoney(order.amount_cents, order.currency)} comes back to you, since there won't be a report.`
    )
  }
  lines.push(`${PRODUCT_NAME} sends it once the study's report is final.`)
  return lines
}

function blockedReason(preview: StudyEndPreview): string | null {
  if (preview.caller_can_end) return null
  if (preview.why_not === 'already_ended') return 'This study has already ended.'
  if (preview.why_not === 'already_full') {
    return 'This study is full. Its last households are finishing, and the report follows.'
  }
  if (preview.why_not === 'not_live') return "This study hasn't gone live."
  if (preview.can_end && !preview.caller_can_end) {
    return 'Only brand admins can end a study.'
  }
  return "This study can't be ended right now."
}

/** Pure dialog copy for End study. Inject `now` for deterministic relative times. */
export function endStudyDialogLines(
  preview: StudyEndPreview,
  title: string,
  now: Date = new Date()
): EndStudyDialogModel {
  const blocked = blockedReason(preview)
  if (blocked) {
    return {
      title: `End “${title}”?`,
      loading: false,
      lines: [],
      canConfirm: false,
      confirmLabel: 'End study',
      cancelLabel: 'Close',
      blockedReason: blocked,
    }
  }

  const lines: string[] = [responsesInLine(preview, now)]

  if (preview.kind === 'concept') {
    if (preview.finishing > 0) {
      lines.push(
        `${plural(preview.finishing, 'person is', 'people are')} partway through. They get ${preview.grace_minutes} minutes to finish.`
      )
    }
    if (preview.not_started > 0) {
      lines.push(
        `${plural(
          preview.not_started,
          "person who signed up but hasn't started won't",
          "people who signed up but haven't started won't"
        )} be able to.`
      )
    }
  } else if (preview.kind === 'ihut') {
    if (preview.finishing > 0) {
      lines.push(
        `${plural(preview.finishing, 'household has', 'households have')} a box on the way or in hand. They finish on their own deadlines, and the report waits for them.`
      )
    }
    if (preview.not_started > 0) {
      lines.push(
        `${plural(preview.not_started, 'place nobody confirmed is', 'places nobody confirmed are')} released.`
      )
    }
  } else {
    if (preview.finishing > 0) {
      lines.push(
        `${plural(preview.finishing, 'participant is', 'participants are')} still finishing.`
      )
    }
    if (preview.not_started > 0) {
      lines.push(
        `${plural(preview.not_started, 'unstarted place is', 'unstarted places are')} released.`
      )
    }
  }

  lines.push(...reportLines(preview))
  lines.push(...refundLines(preview))
  lines.push("Ending can't be undone.")

  return {
    title: `End “${title}”?`,
    loading: false,
    lines,
    canConfirm: true,
    confirmLabel: 'End study',
    cancelLabel: 'Keep it running',
    blockedReason: null,
  }
}

export function endStudySuccessToast(
  result: EndStudyResult,
  now: Date = new Date()
): string {
  if (result.outcome === 'already_ended') return 'This study has already ended.'
  if (result.outcome === 'already_full') {
    return 'This study is full. Its last households are finishing, and the report follows.'
  }
  if (result.kind === 'ihut') {
    return 'Study ended. Households with a box finish on their own deadlines. Your report follows.'
  }
  if (result.kind === 'concept' && result.finish_by) {
    const time = formatEasternTime(result.finish_by)
    if (time) {
      return `Study ended. Anyone partway through has until ${time} to finish. Your report follows.`
    }
  }
  if (result.kind === 'concept') {
    return 'Study ended. Anyone partway through can finish in the grace window. Your report follows.'
  }
  void now
  return 'Study ended. Your report follows if enough responses finish.'
}
