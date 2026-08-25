import { createClient } from '@/lib/supabase'

export type ConglomerateOption = {
  conglomerate_id: number
  display_name: string
}

export type BrandOwnershipEntity = {
  conglomerate_id: number
  display_name: string
  entity_class?: string | null
  status?: string | null
  logo_url?: string | null
  depth?: number | null
}

export type BrandOwnershipDerived = {
  has_parent: boolean
  parent: BrandOwnershipEntity | null
  ultimate: BrandOwnershipEntity | null
  chain?: BrandOwnershipEntity[]
}

export type OwnershipPendingCorrection = {
  correction_id: string
  assertion_type: 'has_parent' | 'independent'
  asserted_conglomerate_id: number | null
  asserted_display_name: string | null
  current_conglomerate_id: number | null
  status: string
  submitted_at: string | null
  user_notes: string | null
}

export type BrandOwnershipForPortal = {
  brand_id: number | null
  derived: BrandOwnershipDerived
  pending_correction: OwnershipPendingCorrection | null
}

export class OwnershipCorrectionError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'OwnershipCorrectionError'
    this.code = code
  }
}

function asEntity(raw: unknown): BrandOwnershipEntity | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = Number(o.conglomerate_id)
  const name = typeof o.display_name === 'string' ? o.display_name.trim() : ''
  if (!Number.isFinite(id) || !name) return null
  return {
    conglomerate_id: id,
    display_name: name,
    entity_class: o.entity_class == null ? null : String(o.entity_class),
    status: o.status == null ? null : String(o.status),
    logo_url: o.logo_url == null ? null : String(o.logo_url),
    depth: o.depth == null ? null : Number(o.depth),
  }
}

function asPending(raw: unknown): OwnershipPendingCorrection | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const assertion =
    o.assertion_type === 'independent' || o.assertion_type === 'has_parent'
      ? o.assertion_type
      : null
  if (!assertion) return null
  return {
    correction_id: String(o.correction_id ?? ''),
    assertion_type: assertion,
    asserted_conglomerate_id:
      o.asserted_conglomerate_id == null ? null : Number(o.asserted_conglomerate_id),
    asserted_display_name:
      o.asserted_display_name == null ? null : String(o.asserted_display_name),
    current_conglomerate_id:
      o.current_conglomerate_id == null ? null : Number(o.current_conglomerate_id),
    status: String(o.status ?? 'pending_human_review'),
    submitted_at: o.submitted_at == null ? null : String(o.submitted_at),
    user_notes: o.user_notes == null ? null : String(o.user_notes),
  }
}

function parsePortalPayload(data: unknown): BrandOwnershipForPortal {
  const emptyDerived: BrandOwnershipDerived = {
    has_parent: false,
    parent: null,
    ultimate: null,
  }
  if (!data || typeof data !== 'object') {
    return { brand_id: null, derived: emptyDerived, pending_correction: null }
  }
  const row = data as Record<string, unknown>
  const derivedRaw = (row.derived ?? row) as Record<string, unknown>
  const hasParent = Boolean(derivedRaw.has_parent)
  const parent = asEntity(derivedRaw.parent)
  const ultimate = asEntity(derivedRaw.ultimate)

  return {
    brand_id: row.brand_id == null ? null : Number(row.brand_id),
    derived: {
      has_parent: hasParent && parent != null,
      parent: hasParent ? parent : null,
      ultimate:
        ultimate && parent && ultimate.conglomerate_id !== parent.conglomerate_id
          ? ultimate
          : null,
      chain: Array.isArray(derivedRaw.chain)
        ? (derivedRaw.chain.map(asEntity).filter(Boolean) as BrandOwnershipEntity[])
        : undefined,
    },
    pending_correction: asPending(row.pending_correction),
  }
}

export function friendlyOwnershipCorrectionError(codeOrMessage: string): string {
  const lower = codeOrMessage.toLowerCase()
  if (lower.includes('correction_matches_current')) {
    return 'That’s already the recorded parent — no correction needed.'
  }
  if (lower.includes('conglomerate_not_active')) {
    return 'That company isn’t selectable. Pick another, or contact support.'
  }
  if (lower.includes('not_authorized')) {
    return 'You don’t have permission to submit corrections.'
  }
  if (lower.includes('no_effective_brand')) {
    return 'Your session doesn’t have an active brand workspace. Refresh and try again.'
  }
  if (
    lower.includes('has_parent_requires_conglomerate') ||
    lower.includes('independent_forbids_conglomerate')
  ) {
    console.error('[ownership correction] shape error — UI bug:', codeOrMessage)
    return 'Couldn’t submit your correction. Try again.'
  }
  return 'Couldn’t submit your correction. Try again.'
}

function extractCode(message: string): string {
  const m = message.match(
    /\b(correction_matches_current|conglomerate_not_active|not_authorized|no_effective_brand|has_parent_requires_conglomerate|independent_forbids_conglomerate)\b/i
  )
  return m ? m[1].toLowerCase() : 'submit_failed'
}

/** Immediate parent display name only (not “· part of ultimate”). */
export function derivedParentDisplayName(
  derived: BrandOwnershipDerived,
  brandName: string
): string | null {
  if (!derived.has_parent || !derived.parent) return null
  const name = derived.parent.display_name.trim()
  if (!name) return null
  if (name.toLowerCase() === brandName.trim().toLowerCase()) return null
  return name
}

export function pendingSuggestionLabel(pending: OwnershipPendingCorrection): string {
  if (pending.assertion_type === 'independent') return 'Independent'
  return pending.asserted_display_name?.trim() || 'a different parent'
}

/**
 * Portal ownership + pending correction. Brand resolved from session (impersonation-aware).
 */
export async function getBrandOwnershipForPortal(): Promise<BrandOwnershipForPortal> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_brand_ownership_for_portal' as never)

  if (error) {
    throw new OwnershipCorrectionError(
      extractCode(error.message),
      friendlyOwnershipCorrectionError(error.message)
    )
  }
  return parsePortalPayload(data)
}

export async function submitBrandOwnershipCorrection(input: {
  assertionType: 'has_parent' | 'independent'
  assertedConglomerateId: number | null
  userNotes?: string | null
  evidenceUrl?: string | null
}): Promise<unknown> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('submit_brand_ownership_correction' as never, {
    p_assertion_type: input.assertionType,
    p_asserted_conglomerate_id:
      input.assertionType === 'independent' ? null : input.assertedConglomerateId,
    p_user_notes: input.userNotes?.trim() || null,
    p_evidence_url: input.evidenceUrl?.trim() || null,
  } as never)

  if (error) {
    throw new OwnershipCorrectionError(
      extractCode(error.message),
      friendlyOwnershipCorrectionError(error.message)
    )
  }
  return data
}

/**
 * Controlled vocabulary for parent picker. Confirm SELECT works before shipping UI.
 */
export async function fetchActiveConglomerates(): Promise<ConglomerateOption[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conglomerates')
    .select('conglomerate_id, display_name')
    .eq('status', 'active')
    .order('display_name')

  if (error) {
    console.error('[conglomerates picker]', error.message)
    throw new OwnershipCorrectionError(
      'conglomerates_unavailable',
      'Couldn’t load company list. Try again.'
    )
  }

  return (data ?? [])
    .map((row) => ({
      conglomerate_id: Number(row.conglomerate_id),
      display_name: String(row.display_name ?? '').trim(),
    }))
    .filter((r) => Number.isFinite(r.conglomerate_id) && r.display_name.length > 0)
}
