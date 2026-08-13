import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { ConceptArmRow } from './types'

export const CONCEPT_STIMULI_BUCKET = 'concept-stimuli'

export const ALLOWED_STIMULI_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export const MAX_STIMULI_BYTES = 15 * 1024 * 1024

const SIGNED_URL_TTL_SEC = 3600

export type StimuliValidationError = 'type' | 'size'

export function validateStimuliFile(file: File): StimuliValidationError | null {
  const mime = (file.type || '').toLowerCase()
  if (!ALLOWED_STIMULI_MIME.has(mime)) return 'type'
  if (file.size > MAX_STIMULI_BYTES) return 'size'
  return null
}

export function stimuliValidationMessage(code: StimuliValidationError): string {
  if (code === 'type') return 'PNG, JPEG or WebP only.'
  return 'Images must be under 15 MB.'
}

function extForFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName) && fromName !== 'jpeg') {
    return fromName === 'jpg' ? 'jpg' : fromName
  }
  const mime = (file.type || '').toLowerCase()
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

/** Safe arm label segment for object keys. */
export function sanitizeArmLabelForPath(armLabel: string): string {
  const cleaned = armLabel.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'arm'
  return cleaned.slice(0, 32)
}

/**
 * Build a fresh object path. UUID is load-bearing — never reuse a path with upsert.
 * Stored as `concept-stimuli/{brandId}/{draftId}/{armLabel}-{uuid}.{ext}`
 */
export function buildStimuliObjectPath(args: {
  brandId: number
  draftId: string
  armLabel: string
  file: File
}): { objectPath: string; storageRef: string } {
  const ext = extForFile(args.file)
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const objectPath = `${args.brandId}/${args.draftId}/${sanitizeArmLabelForPath(args.armLabel)}-${uuid}.${ext}`
  return {
    objectPath,
    storageRef: `${CONCEPT_STIMULI_BUCKET}/${objectPath}`,
  }
}

/** Strip bucket prefix → object path for Storage APIs. */
export function storageRefToObjectPath(storageRef: string): string | null {
  const trimmed = storageRef.trim()
  if (!trimmed) return null
  if (trimmed.startsWith(`${CONCEPT_STIMULI_BUCKET}/`)) {
    return trimmed.slice(CONCEPT_STIMULI_BUCKET.length + 1)
  }
  // Already an object path (legacy) — brand_id/...
  if (/^\d+\//.test(trimmed) && !trimmed.includes('://')) {
    return trimmed
  }
  return null
}

export function isSignedStorageUrl(value: string): boolean {
  return (
    value.includes('/storage/v1/object/sign/') ||
    value.includes('?token=') ||
    value.includes('&token=')
  )
}

export function isExternalHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim()) && !isSignedStorageUrl(value)
}

export function isConceptStimuliRef(value: string): boolean {
  return storageRefToObjectPath(value) != null
}

/** Preview URL: signed for private objects; pass-through for external https. */
export async function resolveStimuliPreviewUrl(
  supabase: SupabaseClient<Database>,
  imageRef: string | null | undefined
): Promise<string | null> {
  if (!imageRef?.trim()) return null
  const value = imageRef.trim()
  if (isSignedStorageUrl(value)) return null
  if (isExternalHttpUrl(value)) return value

  const objectPath = storageRefToObjectPath(value)
  if (!objectPath) return null

  const { data, error } = await supabase.storage
    .from(CONCEPT_STIMULI_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SEC)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export function humanizeUploadError(message: string | undefined): string {
  const msg = (message ?? '').toLowerCase()
  if (
    msg.includes('row-level security') ||
    msg.includes('unauthorized') ||
    msg.includes('not allowed') ||
    msg.includes('403') ||
    msg.includes('permission') ||
    msg.includes('policy')
  ) {
    return "Upload denied — this brand can't write to that folder. Try again while signed into the right brand."
  }
  if (msg.includes('payload too large') || msg.includes('entity too large') || msg.includes('413')) {
    return 'Images must be under 15 MB.'
  }
  if (msg.includes('mime') || msg.includes('content type') || msg.includes('invalid')) {
    return 'PNG, JPEG or WebP only.'
  }
  return message?.trim() || 'Upload failed. Please try again.'
}

export async function uploadConceptStimulus(
  supabase: SupabaseClient<Database>,
  args: {
    brandId: number
    draftId: string
    armLabel: string
    file: File
  }
): Promise<
  | { ok: true; storageRef: string; objectPath: string; filename: string }
  | { ok: false; error: string }
> {
  const invalid = validateStimuliFile(args.file)
  if (invalid) {
    return { ok: false, error: stimuliValidationMessage(invalid) }
  }

  const { objectPath, storageRef } = buildStimuliObjectPath(args)
  const { error } = await supabase.storage.from(CONCEPT_STIMULI_BUCKET).upload(objectPath, args.file, {
    contentType: args.file.type || 'image/jpeg',
    upsert: false,
  })

  if (error) {
    return { ok: false, error: humanizeUploadError(error.message) }
  }

  return {
    ok: true,
    storageRef,
    objectPath,
    filename: args.file.name,
  }
}

/** Migrate arm image fields: drop signed URLs; keep paths + external https; derive filename. */
export function migrateArmImageFields(arm: ConceptArmRow): ConceptArmRow {
  const raw = arm.image_url?.trim() || null
  if (!raw) {
    return { ...arm, image_url: null, image_filename: arm.image_filename ?? null }
  }

  if (isSignedStorageUrl(raw)) {
    return { ...arm, image_url: null, image_filename: null }
  }

  let image_url = raw
  const objectPath = storageRefToObjectPath(raw)
  if (objectPath && !raw.startsWith(`${CONCEPT_STIMULI_BUCKET}/`)) {
    // Normalize bare object paths to bucket-prefixed refs
    if (/^\d+\//.test(raw)) {
      image_url = `${CONCEPT_STIMULI_BUCKET}/${raw}`
    }
  }

  let image_filename = arm.image_filename ?? null
  if (!image_filename) {
    if (objectPath) {
      const leaf = objectPath.split('/').pop() ?? null
      image_filename = leaf
    } else if (isExternalHttpUrl(raw)) {
      try {
        const u = new URL(raw)
        image_filename = decodeURIComponent(u.pathname.split('/').pop() || '') || 'image'
      } catch {
        image_filename = 'image'
      }
    }
  }

  return { ...arm, image_url, image_filename }
}
