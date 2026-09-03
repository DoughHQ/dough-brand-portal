export const APPLICATION_STATUSES = ['pending', 'approved', 'rejected', 'invited'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type BrandApplication = {
  waitlist_id: string
  status: ApplicationStatus
  brand_name_typed: string
  contact_name: string
  contact_email: string
  role_title: string | null
  linkedin_url: string | null
  selected_brand_id: number | null
  selected_brand_name: string | null
  selected_brand_product_count: number | null
  already_claimed: boolean
  flagged_not_mine_count: number
  booking_scheduled_at: string | null
  created_at: string
  reviewed_at: string | null
  review_notes: string | null
}

export type SetBrandApplicationStatusResult = {
  waitlist_id: string
  status: ApplicationStatus
  idempotent_noop: boolean
  grants_access: boolean
  note: string | null
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

  return {
    waitlist_id: waitlistId,
    status: asStatus(o.status),
    brand_name_typed: String(o.brand_name_typed ?? '').trim() || 'Untitled brand',
    contact_name: contactName,
    contact_email: contactEmail,
    role_title: asNullableTrimmed(o.role_title),
    linkedin_url: asNullableTrimmed(o.linkedin_url),
    selected_brand_id: selectedBrandId,
    selected_brand_name: asNullableTrimmed(o.selected_brand_name),
    selected_brand_product_count: selectedBrandProductCount,
    already_claimed: Boolean(o.already_claimed) && selectedBrandId != null,
    flagged_not_mine_count: flagged != null && flagged > 0 ? Math.floor(flagged) : 0,
    booking_scheduled_at: asNullableTrimmed(o.booking_scheduled_at),
    created_at: createdAt,
    reviewed_at: asNullableTrimmed(o.reviewed_at),
    review_notes: asNullableTrimmed(o.review_notes),
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

export function extractApplications(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
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

export function friendlyBrandApplicationsError(codeOrMessage: string): string {
  const lower = codeOrMessage.toLowerCase()
  if (lower.includes('not authorized') || lower.includes('not_authorized') || lower.includes('42501')) {
    return 'You don’t have permission to review brand applications.'
  }
  if (lower.includes('not_found') || lower.includes('application_not_found')) {
    return 'This application is no longer in the queue. Refreshing…'
  }
  if (lower.includes('invalid_decision')) {
    return 'That decision isn’t valid. Try again.'
  }
  return 'Couldn’t complete the review. Try again.'
}

function extractCode(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('42501') || lower.includes('not authorized') || lower.includes('not_authorized')) {
    return 'not_authorized'
  }
  if (lower.includes('not_found') || lower.includes('application_not_found')) {
    return 'not_found'
  }
  if (lower.includes('invalid_decision')) {
    return 'invalid_decision'
  }
  return 'review_failed'
}

type ApplicationsRpcClient = {
  rpc: (
    fn: any,
    args?: any
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export async function listBrandWaitlistApplications(
  supabase: ApplicationsRpcClient
): Promise<BrandApplication[]> {
  const { data, error } = await supabase.rpc('list_brand_waitlist_applications')

  if (error) {
    throw new BrandApplicationsError(
      extractCode(error.message),
      friendlyBrandApplicationsError(error.message).includes('permission')
        ? friendlyBrandApplicationsError(error.message)
        : 'Couldn’t load the applications queue.'
    )
  }

  const rows = extractApplications(data)
    .map(asApplicationRow)
    .filter((r): r is BrandApplication => r != null)

  return sortApplicationsForQueue(rows)
}

export async function setBrandApplicationStatus(
  supabase: ApplicationsRpcClient,
  input: {
    waitlistId: string
    decision: 'approve' | 'reject'
    reviewNotes?: string | null
  }
): Promise<SetBrandApplicationStatusResult> {
  const { data, error } = await supabase.rpc('set_brand_application_status', {
    p_waitlist_id: input.waitlistId,
    p_decision: input.decision,
    p_review_notes: input.reviewNotes?.trim().slice(0, 2000) || null,
  })

  if (error) {
    throw new BrandApplicationsError(
      extractCode(error.message),
      friendlyBrandApplicationsError(error.message)
    )
  }

  const row = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const waitlistId =
    row.waitlist_id != null ? String(row.waitlist_id) : input.waitlistId
  const status = asStatus(
    row.status ?? (input.decision === 'approve' ? 'approved' : 'rejected')
  )

  return {
    waitlist_id: waitlistId,
    status,
    idempotent_noop: Boolean(row.idempotent_noop),
    grants_access: Boolean(row.grants_access),
    note: asNullableTrimmed(row.note),
  }
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
