export const SAFETY_REASONS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  hate: 'Hate speech',
  sexual_content: 'Sexual content',
  violence: 'Violence or threats',
  impersonation: 'Impersonation',
  other: 'Something else',
}

export const SAFETY_SURFACES: Record<string, string> = {
  profile: 'Profile',
  recommendation: 'Recommendation',
  follow_list: 'Follow list',
  search: 'Search',
}

export type SafetyReportRow = {
  report_id: number
  reporter_id: number
  target_user_id: number
  rec_id: number | null
  reason: string
  note: string | null
  surface: string
  snapshot: {
    display_name?: string | null
    handle?: string | null
    bio?: string | null
    avatar_url?: string | null
    rec_note?: string | null
    saved_note?: string | null
    product_id?: number | null
  }
  status: string
  created_at: string
  updated_at: string
  alert_dispatched_at: string | null
  target_display_name: string | null
  target_handle: string | null
  target_avatar_url: string | null
  target_user_status?: string | null
  reporter_display_name: string | null
  reporter_handle: string | null
  prior_reports_on_target: number
  closed_at?: string | null
}

export type SafetyModerationAction = {
  action_id: number
  action: string
  actor_role: string
  detail: Record<string, unknown>
  created_at: string
}

export type SafetyReportsPage = {
  ok: boolean
  total: number
  rows: SafetyReportRow[]
  error?: string
}

export function reasonLabel(reason: string): string {
  return SAFETY_REASONS[reason] ?? reason.replace(/_/g, ' ')
}

export function surfaceLabel(surface: string): string {
  return SAFETY_SURFACES[surface] ?? surface.replace(/_/g, ' ')
}

export function safetyPersonLabel(
  displayName: string | null | undefined,
  handle: string | null | undefined,
  userId?: number,
): string {
  const name = displayName?.trim()
  if (name) return name
  const bare = handle?.trim().replace(/^@/, '')
  if (bare) return `@${bare}`
  if (userId != null) return `User ${userId}`
  return 'Unknown'
}

export function safetyAgeMinutes(iso: string, now = Date.now()): number {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return 0
  return Math.max(0, Math.floor((now - t) / 60_000))
}

export function safetyAgeLabel(iso: string, now = Date.now()): string {
  const m = safetyAgeMinutes(iso, now)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

/** Open > 12h with no action after opened → stale for the desk tone. */
export function safetyIsStale(iso: string, now = Date.now()): boolean {
  return safetyAgeMinutes(iso, now) >= 12 * 60
}

export function safetyDeskHref(opts?: { focusId?: number | null }): string {
  if (opts?.focusId != null && Number.isFinite(opts.focusId)) {
    return `/admin/safety?focus=${opts.focusId}`
  }
  return '/admin/safety'
}

export function parseSafetyFocus(
  params: Record<string, string | string[] | undefined> | undefined,
): number | null {
  if (!params) return null
  const raw = params.focus
  const s = Array.isArray(raw) ? raw[0] : raw
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function severityRank(reason: string): number {
  switch (reason) {
    case 'sexual_content':
    case 'violence':
    case 'hate':
      return 0
    case 'harassment':
    case 'impersonation':
      return 1
    default:
      return 2
  }
}
