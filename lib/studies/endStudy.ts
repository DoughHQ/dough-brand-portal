export type StudyEndKind = 'concept' | 'ihut' | 'other'

export type StudyEndWhyNot = 'already_ended' | 'already_full' | 'not_live'

export type StudyEndOrderPreview = {
  status: string
  completions: number
  unit_price_cents: number
  amount_cents: number
  currency: string
  refund_if_ended_now_cents: number | null
  refund_if_everyone_finishing_finishes_cents: number | null
  settled_at: string | null
  delivered_completions: number | null
  refund_due_cents: number | null
  refund_method: 'refund' | 'credit' | null
  refunded_cents: number | null
  refunded_at: string | null
}

export type StudyEndPreview = {
  mission_id: string
  kind: StudyEndKind
  status: string
  can_end: boolean
  caller_can_end: boolean
  why_not: StudyEndWhyNot | null
  target: number | null
  completed: number
  last_completed_at: string | null
  finishing: number
  not_started: number
  report_minimum: number
  report_if_ended_now: boolean
  grace_minutes: number
  live_since: string | null
  limit_at: string | null
  order: StudyEndOrderPreview | null
}

export type EndStudyResult =
  | {
      outcome: 'ended'
      mission_id: string
      kind: StudyEndKind
      status: 'expired'
      reason: string
      ended_at: string | null
      completed: number
      target: number | null
      released: number
      finishing: number
      finish_by: string | null
    }
  | {
      outcome: 'already_ended'
      mission_id: string
      kind: StudyEndKind
      status: string
      completed: number
      target: number | null
    }
  | {
      outcome: 'already_full'
      mission_id: string
      kind: StudyEndKind
      status: string
      completed: number
      target: number | null
    }

const END_STUDY_HINT_COPY: Record<string, string> = {
  MISSIONS_WRITE_REQUIRED:
    'Your role can view studies but not end them. Ask a brand admin.',
  CROSS_TENANT_ACCESS_DENIED: "You don't have access to that study.",
  NOT_A_BRAND_PORTAL_USER: "You don't have access to that study.",
  MISSION_HAS_NO_OWNING_BRAND: "You don't have access to that study.",
  NOT_AUTHENTICATED: 'Sign in again to end this study.',
  NOT_RUNNING: "This study hasn't gone live, so there's nothing to end.",
  MISSION_NOT_FOUND: 'That study is no longer there.',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function asFiniteInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value)) {
    return value
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const n = Number(value)
    if (Number.isSafeInteger(n)) return n
  }
  return null
}

function asBool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function asKind(value: unknown): StudyEndKind | null {
  return value === 'concept' || value === 'ihut' || value === 'other' ? value : null
}

function asWhyNot(value: unknown): StudyEndWhyNot | null {
  return value === 'already_ended' || value === 'already_full' || value === 'not_live'
    ? value
    : null
}

function asRefundMethod(value: unknown): 'refund' | 'credit' | null {
  return value === 'refund' || value === 'credit' ? value : null
}

function parseOrder(value: unknown): StudyEndOrderPreview | null | undefined {
  if (value == null) return null
  const row = asRecord(value)
  if (!row) return undefined
  const status = asString(row.status)
  const completions = asFiniteInt(row.completions)
  const unit = asFiniteInt(row.unit_price_cents)
  const amount = asFiniteInt(row.amount_cents)
  const currency = asString(row.currency)
  if (
    status == null ||
    completions == null ||
    unit == null ||
    amount == null ||
    currency == null
  ) {
    return undefined
  }

  function optionalInt(value: unknown): number | null | undefined {
    if (value == null) return null
    return asFiniteInt(value) ?? undefined
  }
  function optionalString(value: unknown): string | null | undefined {
    if (value == null) return null
    return asString(value) ?? undefined
  }

  const refundNow = optionalInt(row.refund_if_ended_now_cents)
  const refundIfFinish = optionalInt(row.refund_if_everyone_finishing_finishes_cents)
  const refundDue = optionalInt(row.refund_due_cents)
  const refunded = optionalInt(row.refunded_cents)
  const delivered = optionalInt(row.delivered_completions)
  const settledAt = optionalString(row.settled_at)
  const refundedAt = optionalString(row.refunded_at)
  const refundMethod =
    row.refund_method == null ? null : asRefundMethod(row.refund_method)
  if (
    refundNow === undefined ||
    refundIfFinish === undefined ||
    refundDue === undefined ||
    refunded === undefined ||
    delivered === undefined ||
    settledAt === undefined ||
    refundedAt === undefined ||
    (row.refund_method != null && refundMethod == null)
  ) {
    return undefined
  }

  return {
    status,
    completions,
    unit_price_cents: unit,
    amount_cents: amount,
    currency,
    refund_if_ended_now_cents: refundNow,
    refund_if_everyone_finishing_finishes_cents: refundIfFinish,
    settled_at: settledAt,
    delivered_completions: delivered,
    refund_due_cents: refundDue,
    refund_method: refundMethod,
    refunded_cents: refunded,
    refunded_at: refundedAt,
  }
}

/** Defensive parse for get_study_end_preview. Unknown shapes return null. */
export function parseStudyEndPreview(value: unknown): StudyEndPreview | null {
  const row = asRecord(value)
  if (!row) return null

  const mission_id = asString(row.mission_id)
  const kind = asKind(row.kind)
  const status = asString(row.status)
  const can_end = asBool(row.can_end)
  const caller_can_end = asBool(row.caller_can_end)
  const completed = asFiniteInt(row.completed)
  const finishing = asFiniteInt(row.finishing)
  const not_started = asFiniteInt(row.not_started)
  const report_minimum = asFiniteInt(row.report_minimum)
  const report_if_ended_now = asBool(row.report_if_ended_now)
  const grace_minutes = asFiniteInt(row.grace_minutes)
  if (
    mission_id == null ||
    kind == null ||
    status == null ||
    can_end == null ||
    caller_can_end == null ||
    completed == null ||
    finishing == null ||
    not_started == null ||
    report_minimum == null ||
    report_if_ended_now == null ||
    grace_minutes == null
  ) {
    return null
  }

  const whyRaw = row.why_not
  const why_not = whyRaw == null ? null : asWhyNot(whyRaw)
  if (whyRaw != null && why_not == null) return null

  const targetRaw = row.target
  const target = targetRaw == null ? null : asFiniteInt(targetRaw)
  if (targetRaw != null && target == null) return null

  const lastRaw = row.last_completed_at
  const last_completed_at = lastRaw == null ? null : asString(lastRaw)
  if (lastRaw != null && last_completed_at == null) return null

  const liveRaw = row.live_since
  const live_since = liveRaw == null ? null : asString(liveRaw)
  if (liveRaw != null && live_since == null) return null

  const limitRaw = row.limit_at
  const limit_at = limitRaw == null ? null : asString(limitRaw)
  if (limitRaw != null && limit_at == null) return null

  const order = parseOrder(row.order)
  if (order === undefined) return null

  return {
    mission_id,
    kind,
    status,
    can_end,
    caller_can_end,
    why_not,
    target,
    completed,
    last_completed_at,
    finishing,
    not_started,
    report_minimum,
    report_if_ended_now,
    grace_minutes,
    live_since,
    limit_at,
    order,
  }
}

/** Defensive parse for end_study. Unknown shapes return null. */
export function parseEndStudyResult(value: unknown): EndStudyResult | null {
  const row = asRecord(value)
  if (!row) return null

  const mission_id = asString(row.mission_id)
  const kind = asKind(row.kind)
  const status = asString(row.status)
  const completed = asFiniteInt(row.completed)
  const targetRaw = row.target
  const target = targetRaw == null ? null : asFiniteInt(targetRaw)
  if (
    mission_id == null ||
    kind == null ||
    status == null ||
    completed == null ||
    (targetRaw != null && target == null)
  ) {
    return null
  }

  if (row.ended === true) {
    const reason = asString(row.reason)
    const released = asFiniteInt(row.released)
    const finishing = asFiniteInt(row.finishing)
    const endedRaw = row.ended_at
    const ended_at = endedRaw == null ? null : asString(endedRaw)
    const finishRaw = row.finish_by
    const finish_by = finishRaw == null ? null : asString(finishRaw)
    if (
      reason == null ||
      released == null ||
      finishing == null ||
      (endedRaw != null && ended_at == null) ||
      (finishRaw != null && finish_by == null) ||
      status !== 'expired'
    ) {
      return null
    }
    return {
      outcome: 'ended',
      mission_id,
      kind,
      status: 'expired',
      reason,
      ended_at,
      completed,
      target,
      released,
      finishing,
      finish_by,
    }
  }

  if (row.ended === false && row.already_ended === true) {
    return { outcome: 'already_ended', mission_id, kind, status, completed, target }
  }

  if (row.ended === false && row.already_full === true) {
    return { outcome: 'already_full', mission_id, kind, status, completed, target }
  }

  return null
}

export function endStudyErrorMessage(error: {
  message?: string
  hint?: string | null
}): string {
  const hint = error.hint?.trim()
  if (hint && END_STUDY_HINT_COPY[hint]) return END_STUDY_HINT_COPY[hint]
  const message = error.message ?? ''
  for (const key of Object.keys(END_STUDY_HINT_COPY)) {
    if (message.includes(key)) return END_STUDY_HINT_COPY[key]
  }
  return message.trim() || 'Something went wrong. Try again.'
}

export {
  endStudyDialogLines,
  endStudySuccessToast,
  formatEasternDate,
  formatEasternTime,
} from './endStudyDialog'
export type { EndStudyDialogModel } from './endStudyDialog'
