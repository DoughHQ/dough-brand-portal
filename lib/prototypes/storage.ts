import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const PROTOTYPE_IMAGES_BUCKET = 'prototype-images'

export const ALLOWED_PROTOTYPE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export const MAX_PROTOTYPE_IMAGE_BYTES = 15 * 1024 * 1024
export const MAX_PROTOTYPE_IMAGES = 6

const SIGNED_URL_TTL_SEC = 3600

export type PrototypeImageValidationError = 'type' | 'size'

export function validatePrototypeImage(file: File): PrototypeImageValidationError | null {
  const mime = (file.type || '').toLowerCase()
  if (mime && !ALLOWED_PROTOTYPE_MIME.has(mime)) return 'type'
  if (file.size > MAX_PROTOTYPE_IMAGE_BYTES) return 'size'
  return null
}

export function prototypeImageValidationMessage(code: PrototypeImageValidationError): string {
  if (code === 'type') return 'JPEG, PNG, WebP or HEIC only.'
  return 'Images must be under 15 MB.'
}

function extForFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName === 'jpeg') return 'jpg'
  if (fromName && /^(jpe?g|png|webp|heic|heif)$/.test(fromName)) {
    return fromName === 'heif' ? 'heic' : fromName
  }
  const mime = (file.type || '').toLowerCase()
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/heic' || mime === 'image/heif') return 'heic'
  return 'jpg'
}

/**
 * Build a fresh object path. UUID is load-bearing — never reuse a path with upsert.
 * Stored as `prototype-images/{brandId}/{uuid}.{ext}` (matches save_brand_prototype regex).
 */
export function buildPrototypeImagePath(args: {
  brandId: number
  file: File
}): { objectPath: string; storageRef: string } {
  const ext = extForFile(args.file)
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const filename = `${uuid}.${ext}`
  const objectPath = `${args.brandId}/${filename}`
  return {
    objectPath,
    storageRef: `${PROTOTYPE_IMAGES_BUCKET}/${objectPath}`,
  }
}

export function storageRefToObjectPath(storageRef: string): string | null {
  const trimmed = storageRef.trim()
  if (!trimmed) return null
  if (trimmed.startsWith(`${PROTOTYPE_IMAGES_BUCKET}/`)) {
    return trimmed.slice(PROTOTYPE_IMAGES_BUCKET.length + 1)
  }
  if (/^\d+\//.test(trimmed) && !trimmed.includes('://')) return trimmed
  return null
}

export async function resolvePrototypePreviewUrl(
  supabase: SupabaseClient<Database>,
  imageRef: string | null | undefined
): Promise<string | null> {
  if (!imageRef?.trim()) return null
  const objectPath = storageRefToObjectPath(imageRef.trim())
  if (!objectPath) return null

  const { data, error } = await supabase.storage
    .from(PROTOTYPE_IMAGES_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SEC)

  if (error || !data?.signedUrl) {
    console.warn('[prototype images] createSignedUrl failed', {
      objectPath,
      message: error?.message ?? 'no signedUrl',
    })
    return null
  }
  return data.signedUrl
}

export function humanizePrototypeUploadError(message: string | undefined): string {
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
    return 'JPEG, PNG, WebP or HEIC only.'
  }
  return message?.trim() || 'Upload failed. Please try again.'
}

export async function uploadPrototypeImage(
  supabase: SupabaseClient<Database>,
  args: { brandId: number; file: File }
): Promise<
  | { ok: true; storageRef: string; objectPath: string; filename: string }
  | { ok: false; error: string }
> {
  const invalid = validatePrototypeImage(args.file)
  if (invalid) {
    return { ok: false, error: prototypeImageValidationMessage(invalid) }
  }

  const { objectPath, storageRef } = buildPrototypeImagePath(args)
  const { error } = await supabase.storage.from(PROTOTYPE_IMAGES_BUCKET).upload(objectPath, args.file, {
    contentType: args.file.type || 'image/jpeg',
    upsert: false,
  })

  if (error) {
    return { ok: false, error: humanizePrototypeUploadError(error.message) }
  }

  return {
    ok: true,
    storageRef,
    objectPath,
    filename: args.file.name,
  }
}
