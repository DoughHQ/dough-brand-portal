import { createClient } from '@/lib/supabase'

/** Allowlisted patch keys — must match `update_brand_portal_profile`. */
export type BrandPortalProfilePatch = {
  about_text?: string | null
  brand_story?: string | null
  brand_website_url?: string | null
  instagram_handle?: string | null
  tiktok_handle?: string | null
  youtube_handle?: string | null
  x_handle?: string | null
  linkedin_url?: string | null
  headquarters_city?: string | null
  headquarters_state?: string | null
  founded_year?: number | null
}

export type PersistedBrandPortalProfile = {
  brand_id: number
  brand_name: string
  /** Read-only generated column — never send in a patch. */
  brand_name_display: string | null
  about_text: string | null
  brand_story: string | null
  brand_website_url: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_handle: string | null
  x_handle: string | null
  linkedin_url: string | null
  headquarters_city: string | null
  headquarters_state: string | null
  founded_year: number | null
  logo_url: string | null
  updated_at: string | null
}

export class BrandPortalProfileError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'BrandPortalProfileError'
    this.code = code
  }
}

const HANDLE_FIELDS = new Set([
  'instagram_handle',
  'tiktok_handle',
  'youtube_handle',
  'x_handle',
])

/** Strip leading @ and trim — matches RPC + consumer URL builders. */
export function normalizeHandle(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim().replace(/^@+/, '')
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeWebsite(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeText(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Shape a single-field UI edit into an RPC patch.
 * Empty string → null (clear). Founded year must be integer or null.
 */
export function shapeFieldPatch(
  field: keyof BrandPortalProfilePatch,
  raw: string
): BrandPortalProfilePatch {
  if (field === 'founded_year') {
    const trimmed = raw.trim()
    if (!trimmed) return { founded_year: null }
    const n = Number(trimmed)
    if (!Number.isInteger(n)) {
      throw new BrandPortalProfileError(
        'founded_year_not_integer',
        friendlyProfileError('founded_year_not_integer')
      )
    }
    return { founded_year: n }
  }

  if (HANDLE_FIELDS.has(field)) {
    return { [field]: normalizeHandle(raw) } as BrandPortalProfilePatch
  }

  if (field === 'brand_website_url' || field === 'linkedin_url') {
    return { [field]: normalizeWebsite(raw) } as BrandPortalProfilePatch
  }

  return { [field]: normalizeText(raw) } as BrandPortalProfilePatch
}

export function friendlyProfileError(codeOrMessage: string): string {
  const raw = codeOrMessage.trim()
  const lower = raw.toLowerCase()

  if (lower.includes('founded_year_out_of_range')) {
    return 'Enter a valid founding year.'
  }
  if (lower.includes('founded_year_not_integer')) {
    return 'Founded year must be a whole number.'
  }
  if (lower.includes('field_not_editable')) {
    return 'That field can’t be changed here.'
  }
  if (lower.includes('no_effective_brand')) {
    return 'Your session doesn’t have an active brand workspace. Refresh and try again.'
  }
  if (lower.includes('empty_patch') || lower.includes('no_fields')) {
    return 'Nothing to save.'
  }

  return 'Couldn’t save. Try again.'
}

function extractErrorCode(message: string): string {
  const m = message.match(
    /\b(founded_year_out_of_range|founded_year_not_integer|field_not_editable|no_effective_brand|empty_patch)\b/i
  )
  return m ? m[1].toLowerCase() : 'save_failed'
}

function parsePersisted(data: unknown): PersistedBrandPortalProfile {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new BrandPortalProfileError('save_failed', friendlyProfileError('save_failed'))
  }
  const row = data as Record<string, unknown>
  if (typeof row.brand_id !== 'number' && typeof row.brand_id !== 'string') {
    // Some RPCs wrap as { ok, profile } — accept either shape
    if (row.profile && typeof row.profile === 'object') {
      return parsePersisted(row.profile)
    }
    if (row.error && typeof row.error === 'string') {
      throw new BrandPortalProfileError(extractErrorCode(row.error), friendlyProfileError(row.error))
    }
    throw new BrandPortalProfileError('save_failed', friendlyProfileError('save_failed'))
  }
  return {
    brand_id: Number(row.brand_id),
    brand_name: String(row.brand_name ?? ''),
    brand_name_display:
      row.brand_name_display == null ? null : String(row.brand_name_display),
    about_text: row.about_text == null ? null : String(row.about_text),
    brand_story: row.brand_story == null ? null : String(row.brand_story),
    brand_website_url:
      row.brand_website_url == null ? null : String(row.brand_website_url),
    instagram_handle:
      row.instagram_handle == null ? null : String(row.instagram_handle),
    tiktok_handle: row.tiktok_handle == null ? null : String(row.tiktok_handle),
    youtube_handle: row.youtube_handle == null ? null : String(row.youtube_handle),
    x_handle: row.x_handle == null ? null : String(row.x_handle),
    linkedin_url: row.linkedin_url == null ? null : String(row.linkedin_url),
    headquarters_city:
      row.headquarters_city == null ? null : String(row.headquarters_city),
    headquarters_state:
      row.headquarters_state == null ? null : String(row.headquarters_state),
    founded_year:
      row.founded_year == null || row.founded_year === ''
        ? null
        : Number(row.founded_year),
    logo_url: row.logo_url == null ? null : String(row.logo_url),
    updated_at: row.updated_at == null ? null : String(row.updated_at),
  }
}

/**
 * Persist allowlisted brand profile fields via `update_brand_portal_profile`.
 * Must run with the authenticated user session (not service-role).
 */
export async function updateBrandPortalProfile(
  patch: BrandPortalProfilePatch
): Promise<PersistedBrandPortalProfile> {
  const keys = Object.keys(patch)
  if (keys.length === 0) {
    throw new BrandPortalProfileError('empty_patch', friendlyProfileError('empty_patch'))
  }

  const supabase = createClient()
  const { data, error } = await supabase.rpc(
    'update_brand_portal_profile' as never,
    { p_patch: patch } as never
  )

  if (error) {
    const msg = error.message || 'save_failed'
    throw new BrandPortalProfileError(extractErrorCode(msg), friendlyProfileError(msg))
  }

  return parsePersisted(data)
}
