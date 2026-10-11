import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const APPLICATION_STATUSES = ['pending', 'approved', 'rejected', 'invited'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type CatalogCandidate = {
  brand_id: number
  brand_name: string
  product_count: number
}

export const INVITATION_STATUSES = [
  'pending',
  'accepted',
  'expired',
  'revoked',
] as const
export type InvitationStatus = (typeof INVITATION_STATUSES)[number]

export type ApplicationInvitation = {
  invitation_id: string
  invited_email: string
  brand_id: number
  status: InvitationStatus
  sent_at: string | null
  send_attempts: number
  last_send_error: string | null
  expires_at: string | null
  accepted_at: string | null
  revoked_at: string | null
  created_at: string
}

export type BrandApplication = {
  waitlist_id: string
  status: ApplicationStatus
  brand_name_typed: string
  contact_name: string
  contact_email: string
  role_title: string | null
  linkedin_url: string | null
  brand_website: string | null
  site_host: string | null
  email_domain: string | null
  /** true / false when comparable; null when no website (or pre–Migration A). */
  domain_match: boolean | null
  free_email: boolean
  catalog_candidates: CatalogCandidate[]
  selected_brand_id: number | null
  selected_brand_name: string | null
  selected_brand_product_count: number | null
  already_claimed: boolean
  flagged_not_mine_count: number
  booking_scheduled_at: string | null
  created_at: string
  reviewed_at: string | null
  review_notes: string | null
  alert_sent_at: string | null
  alert_attempts: number
  alert_last_error: string | null
  invitation: ApplicationInvitation | null
  decision_email_sent_at: string | null
  decision_email_attempts: number
  decision_email_error: string | null
}

export type ApplicationChip = {
  label: string
  tone: 'sage' | 'amber' | 'ink'
}

export class BrandApplicationsError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'BrandApplicationsError'
    this.code = code
  }
}

function asFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function asStatus(value: unknown): ApplicationStatus {
  const s = String(value ?? '').toLowerCase()
  return (APPLICATION_STATUSES as readonly string[]).includes(s)
    ? (s as ApplicationStatus)
    : 'pending'
}

function asNullableTrimmed(value: unknown): string | null {
  if (value == null) return null
  const t = String(value).trim()
  return t.length > 0 ? t : null
}

function asDomainMatch(value: unknown): boolean | null {
  if (value === true) return true
  if (value === false) return false
  return null
}

export function asCatalogCandidates(value: unknown): CatalogCandidate[] {
  if (!Array.isArray(value)) return []
  const out: CatalogCandidate[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const brandId = asFiniteNumber(o.brand_id)
    const brandName = String(o.brand_name ?? '').trim()
    const productCount = asFiniteNumber(o.product_count)
    if (brandId == null || brandId <= 0 || !brandName) continue
    out.push({
      brand_id: brandId,
      brand_name: brandName,
      product_count: productCount != null && productCount >= 0 ? Math.floor(productCount) : 0,
    })
  }
  return out
}

function asInvitationStatus(value: unknown): InvitationStatus {
  const s = String(value ?? '').toLowerCase()
  return (INVITATION_STATUSES as readonly string[]).includes(s)
    ? (s as InvitationStatus)
    : 'pending'
}

export function asInvitation(raw: unknown): ApplicationInvitation | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const invitationId = o.invitation_id != null ? String(o.invitation_id).trim() : ''
  const invitedEmail = String(o.invited_email ?? '').trim()
  const brandId = asFiniteNumber(o.brand_id)
  const createdAt = o.created_at != null ? String(o.created_at) : ''
  if (!invitationId || !invitedEmail || brandId == null || !createdAt) return null
  const sendAttempts = asFiniteNumber(o.send_attempts)
  return {
    invitation_id: invitationId,
    invited_email: invitedEmail,
    brand_id: brandId,
    status: asInvitationStatus(o.status),
    sent_at: asNullableTrimmed(o.sent_at),
    send_attempts: sendAttempts != null && sendAttempts > 0 ? Math.floor(sendAttempts) : 0,
    last_send_error: asNullableTrimmed(o.last_send_error),
    expires_at: asNullableTrimmed(o.expires_at),
    accepted_at: asNullableTrimmed(o.accepted_at),
    revoked_at: asNullableTrimmed(o.revoked_at),
    created_at: createdAt,
  }
}

export function contactFirstName(contactName: string): string {
  const first = contactName.trim().split(/\s+/)[0] ?? ''
  return first.slice(0, 60)
}

function chipTime(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

/** Queue status chip — safe defaults when invitation / decision-email keys are absent. */
export function applicationChip(row: BrandApplication): ApplicationChip {
  if (row.status === 'pending') {
    return { label: 'Pending', tone: 'ink' }
  }

  if (row.status === 'invited') {
    const inv = row.invitation
    if (inv?.status === 'accepted') return { label: 'Joined', tone: 'sage' }
    if (inv?.status === 'expired') return { label: 'Invite expired', tone: 'amber' }
    if (inv?.status === 'revoked') return { label: 'Invite revoked', tone: 'ink' }
    if (inv?.sent_at) {
      const t = chipTime(inv.sent_at)
      return { label: t ? `Invited · sent ${t}` : 'Invited · sent', tone: 'sage' }
    }
    if (inv?.last_send_error || (inv != null && inv.send_attempts > 0)) {
      return { label: 'Invited · email failed', tone: 'amber' }
    }
    return { label: 'Invited · not sent', tone: 'amber' }
  }

  if (row.status === 'rejected') {
    if (row.decision_email_sent_at) {
      return { label: 'Rejected · reply sent', tone: 'ink' }
    }
    if (row.decision_email_error || row.decision_email_attempts > 0) {
      return { label: 'Rejected · reply failed', tone: 'amber' }
    }
    return { label: 'Rejected · no reply', tone: 'ink' }
  }

  return { label: 'Approved', tone: 'sage' }
}

/** Exported for tests — drop a row rather than invent an application. */
export function asApplicationRow(raw: unknown): BrandApplication | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const waitlistId = o.waitlist_id != null ? String(o.waitlist_id).trim() : ''
  if (!waitlistId) return null

  const contactName = String(o.contact_name ?? '').trim()
  const contactEmail = String(o.contact_email ?? '').trim()
  if (!contactName || !contactEmail) return null

  const selectedBrandId = asFiniteNumber(o.selected_brand_id)
  const productCountRaw = asFiniteNumber(o.selected_brand_product_count)
  const selectedBrandProductCount =
    selectedBrandId == null ? null : productCountRaw

  const flagged = asFiniteNumber(o.flagged_not_mine_count)
  const createdAt = o.created_at != null ? String(o.created_at) : ''
  if (!createdAt) return null

  const alertAttemptsRaw = asFiniteNumber(o.alert_attempts)
  const decisionAttemptsRaw = asFiniteNumber(o.decision_email_attempts)

  return {
    waitlist_id: waitlistId,
    status: asStatus(o.status),
    brand_name_typed: String(o.brand_name_typed ?? '').trim() || 'Untitled brand',
    contact_name: contactName,
    contact_email: contactEmail,
    role_title: asNullableTrimmed(o.role_title),
    linkedin_url: asNullableTrimmed(o.linkedin_url),
    brand_website: asNullableTrimmed(o.brand_website),
    site_host: asNullableTrimmed(o.site_host),
    email_domain: asNullableTrimmed(o.email_domain),
    domain_match: asDomainMatch(o.domain_match),
    free_email: Boolean(o.free_email),
    catalog_candidates: asCatalogCandidates(o.catalog_candidates),
    selected_brand_id: selectedBrandId,
    selected_brand_name: asNullableTrimmed(o.selected_brand_name),
    selected_brand_product_count: selectedBrandProductCount,
    already_claimed: Boolean(o.already_claimed) && selectedBrandId != null,
    flagged_not_mine_count: flagged != null && flagged > 0 ? Math.floor(flagged) : 0,
    booking_scheduled_at: asNullableTrimmed(o.booking_scheduled_at),
    created_at: createdAt,
    reviewed_at: asNullableTrimmed(o.reviewed_at),
    review_notes: asNullableTrimmed(o.review_notes),
    alert_sent_at: asNullableTrimmed(o.alert_sent_at),
    alert_attempts:
      alertAttemptsRaw != null && alertAttemptsRaw > 0 ? Math.floor(alertAttemptsRaw) : 0,
    alert_last_error: asNullableTrimmed(o.alert_last_error),
    invitation: asInvitation(o.invitation),
    decision_email_sent_at: asNullableTrimmed(o.decision_email_sent_at),
    decision_email_attempts:
      decisionAttemptsRaw != null && decisionAttemptsRaw > 0
        ? Math.floor(decisionAttemptsRaw)
        : 0,
    decision_email_error: asNullableTrimmed(o.decision_email_error),
  }
}

const STATUS_RANK: Record<ApplicationStatus, number> = {
  pending: 0,
  invited: 1,
  approved: 2,
  rejected: 3,
}

/** Pending first, then invited / approved / rejected. Newest within each group. */
export function sortApplicationsForQueue(rows: BrandApplication[]): BrandApplication[] {
  return [...rows].sort((a, b) => {
    const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status]
    if (rank !== 0) return rank
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

/**
 * Prefer `items` (live list_brand_waitlist_applications_page), then legacy
 * `applications`, then a bare array.
 */
export function extractApplications(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  if (Array.isArray(o.items)) return o.items
  if (Array.isArray(o.applications)) return o.applications
  return []
}

/**
 * Accept http(s). If the applicant omitted a scheme (`linkedin.com/in/jane`),
 * prepend https. Reject javascript: and other junk.
 */
export function safeLinkedInHref(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null
  let candidate = raw.trim()
  if (!/^[a-zA-Z][a-zA-Z+.-]*:/.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, '')}`
  }
  try {
    const u = new URL(candidate)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

/** Same rules as safeLinkedInHref — brand websites must be http(s) only. */
export function safeWebHref(raw: string | null | undefined): string | null {
  return safeLinkedInHref(raw)
}

export function friendlyBrandApplicationsError(codeOrMessage: string): string {
  const lower = codeOrMessage.toLowerCase()
  if (lower.includes('not authorized') || lower.includes('not_authorized') || lower.includes('42501')) {
    return 'You don’t have permission to review brand applications.'
  }
  if (lower.includes('not_found') || lower.includes('application_not_found')) {
    return 'This application is no longer in the queue. Refreshing…'
  }
  if (lower.includes('invites_disabled')) {
    return 'Invites are switched off until the join page and security checks ship. Nothing was changed.'
  }
  if (lower.includes('impersonat')) {
    return 'Leave the brand workspace (stop impersonating) before reviewing applications.'
  }
  if (lower.includes('invalid_decision')) {
    return 'That decision isn’t valid. Try again.'
  }
  return 'Couldn’t complete the review. Try again.'
}

export type DecisionResultTone = 'error' | 'warn' | 'info'

export type DecisionResultDescription = {
  message: string
  tone: DecisionResultTone
  closeAndRefresh: boolean
}

export type DescribeDecisionExtras = {
  invitedEmail?: string | null
  hasCandidates?: boolean
  httpStatus?: number
}

const ALREADY_DECIDED = new Set([
  'not_pending',
  'not_invited',
  'not_rejectable',
  'already_accepted',
])

/**
 * Maps brand_application_decision refusal codes to queue copy and behaviour.
 * send_error on a successful approve/resend/reject is not an error code — handle separately.
 */
export function describeDecisionResult(
  code: string,
  extras?: DescribeDecisionExtras
): DecisionResultDescription {
  const raw = String(code ?? '').trim()
  const normalized = raw.toLowerCase()
  const httpStatus = extras?.httpStatus

  if (httpStatus === 401 || normalized === '401') {
    return {
      message: 'Your session expired. Sign in again.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (
    normalized === 'impersonating' ||
    normalized === 'impersonation' ||
    normalized.includes('impersonat')
  ) {
    return {
      message: friendlyBrandApplicationsError('impersonating'),
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (
    normalized === 'not_authorized' ||
    normalized.includes('not authorized') ||
    normalized.includes('42501') ||
    httpStatus === 403
  ) {
    return {
      message: friendlyBrandApplicationsError('not_authorized'),
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'invites_disabled') {
    return {
      message: friendlyBrandApplicationsError('invites_disabled'),
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'not_found' || normalized === 'application_not_found') {
    return {
      message: 'This application is no longer in the queue.',
      tone: 'info',
      closeAndRefresh: true,
    }
  }

  if (ALREADY_DECIDED.has(normalized)) {
    return {
      message:
        'This application was already decided. The list is refreshed to show where it stands.',
      tone: 'info',
      closeAndRefresh: true,
    }
  }

  if (normalized === 'already_invited') {
    return {
      message: 'An invite for this email and brand is already pending. Nothing was changed.',
      tone: 'info',
      closeAndRefresh: true,
    }
  }

  if (normalized === 'possible_duplicate') {
    if (extras?.hasCandidates) {
      return {
        message:
          'This may already be in the catalog. Pick the brand to link, or choose Create new brand.',
        tone: 'warn',
        closeAndRefresh: false,
      }
    }
    return {
      message:
        'This name may already exist in the catalog. Refresh and try again. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'brand_not_active') {
    return {
      message:
        'That brand isn’t active in the catalog. Pick another or create a new one. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'brand_already_has_admin') {
    return {
      message: 'That brand already has an admin. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'brand_has_pending_invite') {
    const email = extras?.invitedEmail?.trim()
    return {
      message: email
        ? `${email} already has a pending invite to this brand. Revoke it or let it expire first. Nothing was changed.`
        : 'Someone already has a pending invite to this brand. Revoke it or let it expire first. Nothing was changed.',
      tone: 'warn',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'invalid_brand_name') {
    return {
      message: 'Brand name must be 1–200 characters.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (
    normalized === 'invalid_body' ||
    normalized === 'invalid_token_hash' ||
    normalized === 'invalid_action' ||
    normalized === 'invalid_waitlist_id' ||
    normalized.startsWith('invalid_')
  ) {
    return {
      message: 'Couldn’t prepare that request. Nothing was changed.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  if (normalized === 'rpc_failed' || normalized === 'misconfigured') {
    return {
      message: 'The decision wasn’t saved. Nothing was changed. Try again.',
      tone: 'error',
      closeAndRefresh: false,
    }
  }

  return {
    message: 'Couldn’t confirm whether it went through. Refresh to see where it stands.',
    tone: 'error',
    closeAndRefresh: false,
  }
}

function extractCode(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('42501') || lower.includes('not authorized') || lower.includes('not_authorized')) {
    return 'not_authorized'
  }
  if (lower.includes('not_found') || lower.includes('application_not_found')) {
    return 'not_found'
  }
  if (lower.includes('invites_disabled')) {
    return 'invites_disabled'
  }
  if (lower.includes('invalid_decision')) {
    return 'invalid_decision'
  }
  return 'review_failed'
}

type ApplicationsRpcClient = Pick<SupabaseClient<Database>, 'rpc'>

export type BrandApplicationsPageCursor = {
  statusRank: number
  createdAt: string
  id: string
}

export type BrandApplicationsPage = {
  rows: BrandApplication[]
  hasMore: boolean
  nextCursor: BrandApplicationsPageCursor | null
}

export async function listBrandWaitlistApplicationsPage(
  supabase: ApplicationsRpcClient,
  opts?: {
    limit?: number
    cursor?: BrandApplicationsPageCursor | null
    status?: ApplicationStatus | null
  }
): Promise<BrandApplicationsPage> {
  const { data, error } = await supabase.rpc('list_brand_waitlist_applications_page' as never, {
    p_limit: opts?.limit ?? 25,
    p_cursor_rank: opts?.cursor?.statusRank ?? null,
    p_cursor_created_at: opts?.cursor?.createdAt ?? null,
    p_cursor_id: opts?.cursor?.id ?? null,
    p_status: opts?.status ?? null,
  } as never)

  if (error) {
    throw new BrandApplicationsError(
      extractCode(error.message),
      friendlyBrandApplicationsError(error.message).includes('permission')
        ? friendlyBrandApplicationsError(error.message)
        : 'Couldn’t load the applications queue.'
    )
  }

  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const rows = extractApplications(root)
    .map(asApplicationRow)
    .filter((r): r is BrandApplication => r != null)

  const cursorRaw =
    root.next_cursor && typeof root.next_cursor === 'object'
      ? (root.next_cursor as Record<string, unknown>)
      : null
  const nextCursor =
    root.has_more === true &&
    cursorRaw?.id != null &&
    cursorRaw.created_at != null &&
    cursorRaw.status_rank != null
      ? {
          statusRank: Number(cursorRaw.status_rank),
          createdAt: String(cursorRaw.created_at),
          id: String(cursorRaw.id),
        }
      : null

  return {
    rows: sortApplicationsForQueue(rows),
    hasMore: root.has_more === true && nextCursor != null,
    nextCursor,
  }
}

export async function listBrandWaitlistApplications(
  supabase: ApplicationsRpcClient
): Promise<BrandApplication[]> {
  const page = await listBrandWaitlistApplicationsPage(supabase, { limit: 50 })
  return page.rows
}

export function formatProductCount(row: BrandApplication): string {
  if (row.selected_brand_id == null || row.selected_brand_product_count == null) return '—'
  return row.selected_brand_product_count.toLocaleString()
}

export function brandDecisionLabel(row: BrandApplication): string {
  if (row.selected_brand_id == null) {
    return row.brand_name_typed
  }
  return row.selected_brand_name ?? row.brand_name_typed
}
