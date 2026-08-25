import { createClient } from '@/lib/supabase'

export type PendingOwnershipCorrection = {
  correction_id: string
  brand_id: number
  brand_name: string
  assertion_type: 'has_parent' | 'independent'
  asserted_conglomerate_id: number | null
  asserted_display_name: string | null
  current_conglomerate_id: number | null
  current_display_name: string | null
  snapshot_is_stale: boolean
  live_conglomerate_id: number | null
  user_notes: string | null
  evidence_url: string | null
  submitted_by_portal_user_id: string | null
  submitted_at: string | null
}

export type ReviewOwnershipResult = {
  status: 'accepted' | 'rejected' | string
  idempotent_noop: boolean
  was_stale?: boolean
  brand_id?: number
  new_conglomerate_id?: number | null
}

export class OwnershipReviewError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'OwnershipReviewError'
    this.code = code
  }
}

function asRow(raw: unknown): PendingOwnershipCorrection | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const correctionId = o.correction_id != null ? String(o.correction_id) : ''
  const brandId = Number(o.brand_id)
  if (!correctionId || !Number.isFinite(brandId)) return null
  const assertion =
    o.assertion_type === 'independent' || o.assertion_type === 'has_parent'
      ? o.assertion_type
      : null
  if (!assertion) return null

  const submittedAt =
    o.q_submitted_at != null
      ? String(o.q_submitted_at)
      : o.submitted_at != null
        ? String(o.submitted_at)
        : null

  return {
    correction_id: correctionId,
    brand_id: brandId,
    brand_name: String(o.brand_name ?? `Brand ${brandId}`),
    assertion_type: assertion,
    asserted_conglomerate_id:
      o.asserted_conglomerate_id == null ? null : Number(o.asserted_conglomerate_id),
    asserted_display_name:
      o.asserted_display_name == null ? null : String(o.asserted_display_name),
    current_conglomerate_id:
      o.current_conglomerate_id == null ? null : Number(o.current_conglomerate_id),
    current_display_name:
      o.current_display_name == null ? null : String(o.current_display_name),
    snapshot_is_stale: Boolean(o.snapshot_is_stale),
    live_conglomerate_id:
      o.live_conglomerate_id == null ? null : Number(o.live_conglomerate_id),
    user_notes: o.user_notes == null ? null : String(o.user_notes),
    evidence_url: o.evidence_url == null ? null : String(o.evidence_url),
    submitted_by_portal_user_id:
      o.submitted_by_portal_user_id == null
        ? null
        : String(o.submitted_by_portal_user_id),
    submitted_at: submittedAt,
  }
}

export function changeSummary(row: PendingOwnershipCorrection): string {
  const from = row.current_display_name?.trim() || 'None'
  if (row.assertion_type === 'independent') {
    return `Change parent: ${from} → Independent (no parent)`
  }
  const to = row.asserted_display_name?.trim() || 'Unknown company'
  return `Change parent: ${from} → ${to}`
}

export function safeEvidenceHref(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

export function friendlyOwnershipReviewError(codeOrMessage: string): string {
  const lower = codeOrMessage.toLowerCase()
  if (lower.includes('stale_snapshot')) {
    return 'The parent changed since submission — re-verify and confirm to apply.'
  }
  if (lower.includes('asserted_conglomerate_not_active')) {
    return 'The suggested parent company is no longer active. Reject this correction, or contact data ops.'
  }
  if (lower.includes('cannot_review_superseded')) {
    return 'This correction was replaced by a newer one.'
  }
  if (lower.includes('not_authorized')) {
    return 'You don’t have permission to review ownership corrections.'
  }
  if (lower.includes('correction_not_found')) {
    return 'This correction is no longer in the queue. Refreshing…'
  }
  return 'Couldn’t complete the review. Try again.'
}

function extractCode(message: string): string {
  const m = message.match(
    /\b(stale_snapshot|asserted_conglomerate_not_active|cannot_review_superseded|not_authorized|correction_not_found)\b/i
  )
  return m ? m[1].toLowerCase() : 'review_failed'
}

type OwnershipRpcClient = {
  // Supabase client's rpc is typed to a function-name union; keep this loose so
  // server + browser clients both type-check when calling SECURITY DEFINER RPCs.
  rpc: (
    fn: any,
    args?: any
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export async function listPendingOwnershipCorrections(
  supabase: OwnershipRpcClient
): Promise<PendingOwnershipCorrection[]> {
  const { data, error } = await supabase.rpc('list_pending_ownership_corrections')

  if (error) {
    throw new OwnershipReviewError(
      extractCode(error.message),
      friendlyOwnershipReviewError(error.message)
    )
  }

  const arr = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { corrections?: unknown }).corrections)
      ? ((data as { corrections: unknown[] }).corrections)
      : []

  return arr.map(asRow).filter((r): r is PendingOwnershipCorrection => r != null)
}

export async function reviewBrandOwnershipCorrection(
  supabase: OwnershipRpcClient,
  input: {
    correctionId: string
    decision: 'accept' | 'reject'
    reviewNotes?: string | null
    overrideStale?: boolean
  }
): Promise<ReviewOwnershipResult> {
  const { data, error } = await supabase.rpc('review_brand_ownership_correction', {
    p_correction_id: input.correctionId,
    p_decision: input.decision,
    p_review_notes: input.reviewNotes?.trim().slice(0, 2000) || null,
    p_override_stale: input.overrideStale === true,
  })

  if (error) {
    throw new OwnershipReviewError(
      extractCode(error.message),
      friendlyOwnershipReviewError(error.message)
    )
  }

  const row = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  return {
    status: String(row.status ?? (input.decision === 'accept' ? 'accepted' : 'rejected')),
    idempotent_noop: Boolean(row.idempotent_noop),
    was_stale: row.was_stale == null ? undefined : Boolean(row.was_stale),
    brand_id: row.brand_id == null ? undefined : Number(row.brand_id),
    new_conglomerate_id:
      row.new_conglomerate_id === undefined
        ? undefined
        : row.new_conglomerate_id == null
          ? null
          : Number(row.new_conglomerate_id),
  }
}

/** Resolve live parent label for stale warnings. */
export function liveParentLabel(
  row: PendingOwnershipCorrection,
  liveNameById?: Map<number, string>
): string {
  const liveId = row.live_conglomerate_id
  if (liveId == null) return 'None'
  if (row.current_conglomerate_id === liveId && row.current_display_name) {
    return row.current_display_name
  }
  if (row.asserted_conglomerate_id === liveId && row.asserted_display_name) {
    return row.asserted_display_name
  }
  const looked = liveNameById?.get(liveId)
  if (looked) return looked
  return `Conglomerate #${liveId}`
}

export async function fetchConglomerateNames(
  ids: number[]
): Promise<Map<number, string>> {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id)))]
  const map = new Map<number, string>()
  if (unique.length === 0) return map

  const supabase = createClient()
  const { data, error } = await supabase
    .from('conglomerates')
    .select('conglomerate_id, display_name')
    .in('conglomerate_id', unique)

  if (error || !data) return map
  for (const row of data) {
    map.set(Number(row.conglomerate_id), String(row.display_name ?? ''))
  }
  return map
}
