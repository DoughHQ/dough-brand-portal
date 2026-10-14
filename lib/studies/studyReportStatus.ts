import { formatOrderMoney } from '@/lib/checkout/money'
import {
  formatEasternDate,
  type StudyEndPreview,
} from './endStudy'

export type StudyReportStatusKind =
  | 'collecting'
  | 'finishing'
  | 'building'
  | 'waiting_on_finishers'
  | 'no_report'
  | 'fallback'

export type StudyReportStatus = {
  kind: StudyReportStatusKind
  title: string
  body: string
  progressRatio: number | null
  showEndStudy: boolean
  orderLine: string | null
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

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

function isEnded(preview: StudyEndPreview): boolean {
  return (
    preview.status === 'expired' ||
    preview.status === 'completed' ||
    preview.status === 'archived' ||
    preview.why_not === 'already_ended'
  )
}

function orderLine(preview: StudyEndPreview): string | null {
  const order = preview.order
  if (!order || order.status !== 'paid') return null

  if (order.refunded_at != null && order.refunded_cents != null) {
    const when = formatEasternDate(order.refunded_at)
    const amount = formatOrderMoney(order.refunded_cents, order.currency)
    const dateBit = when ? ` on ${when}` : ''
    if (order.refund_method === 'credit') {
      return `${amount} was credited toward your next study${dateBit}.`
    }
    return `${amount} was refunded${dateBit}.`
  }

  if (order.refund_due_cents != null && order.refund_due_cents > 0) {
    return `${formatOrderMoney(order.refund_due_cents, order.currency)} is owed back to you. We'll confirm here when it's sent.`
  }

  // Full-amount promise only after the study has ended without a report path.
  if (
    isEnded(preview) &&
    preview.completed < preview.report_minimum &&
    preview.finishing === 0
  ) {
    return `The full ${formatOrderMoney(order.amount_cents, order.currency)} comes back to you.`
  }

  return null
}

function collectingBody(preview: StudyEndPreview, now: Date): string {
  const relative =
    preview.last_completed_at != null
      ? relativeAgo(preview.last_completed_at, now)
      : null
  const relativeBit = relative ? `, the last ${relative}` : ''
  const targetBit =
    preview.target != null
      ? `${preview.completed} of ${preview.target} responses so far${relativeBit}`
      : `${plural(preview.completed, 'response', 'responses')} so far${relativeBit}`
  const limit = preview.limit_at != null ? formatEasternDate(preview.limit_at) : null
  const limitBit = limit
    ? ` (by ${limit} at the latest)`
    : ''
  return `${targetBit}. The report is built when the study is full, or when it ends${limitBit}.`
}

/** Pure report-not-ready model. Inject `now` for deterministic relative times. */
export function studyReportStatus(
  preview: StudyEndPreview,
  now: Date = new Date()
): StudyReportStatus {
  const line = orderLine(preview)

  if (preview.why_not === 'already_full') {
    const target = preview.target ?? preview.completed + preview.finishing
    return {
      kind: 'finishing',
      title: 'Full, and finishing up',
      body: `${preview.completed} of ${target} households are done and ${preview.finishing} are finishing. The report follows when they're done.`,
      progressRatio:
        target > 0 ? Math.min(1, preview.completed / target) : null,
      showEndStudy: false,
      orderLine: line,
    }
  }

  if (!isEnded(preview) && preview.can_end) {
    const target = preview.target
    return {
      kind: 'collecting',
      title: 'Still collecting responses',
      body: collectingBody(preview, now),
      progressRatio:
        target != null && target > 0
          ? Math.min(1, preview.completed / target)
          : null,
      showEndStudy: preview.caller_can_end,
      orderLine: null,
    }
  }

  if (isEnded(preview) && preview.completed >= preview.report_minimum) {
    let body: string
    if (preview.kind === 'ihut' && preview.finishing > 0) {
      body = `${preview.completed} households have finished and ${preview.finishing} are still going. The report follows when they're done.`
    } else if (preview.kind === 'concept') {
      body = `This study ended with ${preview.completed} responses. The report is usually ready about 20 minutes after it ends.`
    } else {
      body = `This study ended with ${preview.completed} responses. The report is being built.`
    }
    return {
      kind: 'building',
      title: 'Building your report',
      body,
      progressRatio: null,
      showEndStudy: false,
      orderLine: line,
    }
  }

  if (isEnded(preview) && preview.finishing > 0) {
    return {
      kind: 'waiting_on_finishers',
      title: 'Waiting on the last responses',
      body: `${preview.completed} responses so far and ${preview.finishing} still finishing. A report needs ${preview.report_minimum}.`,
      progressRatio: null,
      showEndStudy: false,
      orderLine: line,
    }
  }

  if (isEnded(preview)) {
    return {
      kind: 'no_report',
      title: 'No report for this study',
      body: `This study ended with ${preview.completed} responses. A report needs at least ${preview.report_minimum}, so there isn't one.`,
      progressRatio: null,
      showEndStudy: false,
      orderLine: line,
    }
  }

  return {
    kind: 'fallback',
    title: "Report isn't ready yet",
    body: 'The report appears here once the study has finished.',
    progressRatio: null,
    showEndStudy: false,
    orderLine: null,
  }
}

export function studyReportFallbackStatus(): StudyReportStatus {
  return {
    kind: 'fallback',
    title: "Report isn't ready yet",
    body: 'The report appears here once the study has finished.',
    progressRatio: null,
    showEndStudy: false,
    orderLine: null,
  }
}
