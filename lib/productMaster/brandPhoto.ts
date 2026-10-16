/**
 * Brand pack shots, client side.
 *
 * The browser converts to JPEG and uploads only under `{brand}/holding/{uuid}.jpg`.
 * `moderate_brand_image` names the public file. This module never builds a
 * `products/` path and never registers the photo.
 */

export const BRAND_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'

const MAX_SOURCE_BYTES = 25 * 1024 * 1024
const MAX_JPEG_BYTES = 9.5 * 1024 * 1024
const MIN_EDGE = 800
const MAX_EDGE = 2400
const JPEG_QUALITY = 0.85
/** First encode, then at most three smaller redraws. */
const MAX_ENCODE_PASSES = 4

const HOLDING_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const BRAND_PHOTO_COPY = {
  heic: 'That’s a HEIC photo. Export it as a JPG or PNG and try again.',
  format: 'Use a JPG, PNG or WebP photo.',
  tooLargeSource: 'That photo is too large. Use one under 25 MB.',
  tooLargeJpeg: 'That photo is too large. Try a smaller one.',
  unreadable: 'Couldn’t read that photo. Try a different file.',
  tooSmall: 'That photo is too small. Use one at least 800 pixels on each side.',
  community:
    'That photo can’t be used. It doesn’t meet our community standards. Try a different one.',
  rateLimited: 'Too many photos were checked recently. Wait and try again.',
  notAuthorized: 'Your role can’t add photos for this brand.',
  sessionExpired: 'Your session expired. Sign in again.',
  uploadFailed: 'The upload didn’t finish. Check your connection and try again.',
  changed: 'That photo changed while we were checking it. Try again.',
  fallback: 'Couldn’t check that photo. Try again.',
} as const

export type BrandPhotoOk = { ok: true }
export type BrandPhotoFail = { ok: false; message: string }
export type BrandPhotoPrepared = { ok: true; blob: Blob } | BrandPhotoFail
export type BrandPhotoUploaded =
  | { ok: true; storagePath: string; publicUrl: string | null }
  | BrandPhotoFail

export type BrandPhotoBitmap = {
  width: number
  height: number
  close: () => void
}

export type BrandPhotoDecodeOptions = {
  imageOrientation: 'from-image'
  resizeWidth: number
  resizeHeight: number
  resizeQuality: 'high'
}

/** A recording-friendly slice of a 2D canvas. Tests supply their own. */
export type BrandPhotoContext = {
  fillStyle: string
  fillRect: (x: number, y: number, w: number, h: number) => void
  drawImage: (image: BrandPhotoBitmap, x: number, y: number, w: number, h: number) => void
  canvas: HTMLCanvasElement | null
}

export type BrandPhotoDeps = {
  readSize: (file: File) => Promise<{ width: number; height: number }>
  decode: (file: File, options: BrandPhotoDecodeOptions) => Promise<BrandPhotoBitmap>
  createCanvas: (width: number, height: number) => BrandPhotoContext
  encode: (context: BrandPhotoContext, quality: number) => Promise<Blob | null>
}

export type BrandPhotoModerate = (input: { holdingPath: string }) => Promise<
  | { ok: true; storagePath: string; publicUrl: string | null }
  | { ok: false; code: string }
>

type BrandPhotoClient = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Blob,
        options: { upsert: boolean; contentType: string },
      ) => Promise<{ error: { message?: string } | null }>
    }
  }
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return ''
  return name.slice(dot).toLowerCase()
}

export function validateBrandPhotoFile(file: File): BrandPhotoOk | BrandPhotoFail {
  const type = file.type.toLowerCase()
  const ext = extensionOf(file.name)
  if (
    type === 'image/heic' ||
    type === 'image/heif' ||
    ext === '.heic' ||
    ext === '.heif'
  ) {
    return { ok: false, message: BRAND_PHOTO_COPY.heic }
  }

  const typeOk =
    type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp'
  const extOk = ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp'
  if (!(type ? typeOk : extOk)) {
    return { ok: false, message: BRAND_PHOTO_COPY.format }
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return { ok: false, message: BRAND_PHOTO_COPY.tooLargeSource }
  }
  return { ok: true }
}

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height)
  const scale = longEdge > maxEdge ? maxEdge / longEdge : 1
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function brandHoldingPath(brandId: number, id: string): string {
  if (!Number.isSafeInteger(brandId) || brandId <= 0) {
    throw new Error('brandHoldingPath: invalid brand id')
  }
  if (!HOLDING_ID.test(id)) {
    throw new Error('brandHoldingPath: invalid id')
  }
  return `${brandId}/holding/${id}.jpg`
}

export function isBrandPublishedPath(path: string, brandId: number): boolean {
  if (!Number.isSafeInteger(brandId) || brandId <= 0) return false
  const match = /^(\d+)\/products\/([0-9a-f]{64})\.jpg$/.exec(path)
  if (!match) return false
  return match[1] === String(brandId)
}

export function describeBrandPhotoError(
  code: string | null | undefined,
  fallback?: string,
): string {
  switch (code) {
    case 'community_standards':
      return BRAND_PHOTO_COPY.community
    case 'rate_limited':
      return BRAND_PHOTO_COPY.rateLimited
    case 'not_authorized':
      return BRAND_PHOTO_COPY.notAuthorized
    case 'session_expired':
      return BRAND_PHOTO_COPY.sessionExpired
    case 'unsupported_format':
      return BRAND_PHOTO_COPY.format
    case 'too_large':
      return BRAND_PHOTO_COPY.tooLargeJpeg
    case 'upload_failed':
    case 'not_found':
      return BRAND_PHOTO_COPY.uploadFailed
    case 'changed':
      return BRAND_PHOTO_COPY.changed
    default:
      return fallback ?? BRAND_PHOTO_COPY.fallback
  }
}

function paint(ctx: BrandPhotoContext, bitmap: BrandPhotoBitmap, width: number, height: number) {
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
}

/**
 * Source pixels come from an `<img>` load, which does decode the file.
 * `createImageBitmap` then decodes again already scaled, and that smaller
 * bitmap is the one drawn. A second pass, when the JPEG is still over 9.5 MB,
 * redraws that same bitmap 20% smaller on the long edge. Quality stays 0.85.
 */
export async function prepareBrandPhoto(
  file: File,
  deps: BrandPhotoDeps = browserDeps(),
): Promise<BrandPhotoPrepared> {
  const valid = validateBrandPhotoFile(file)
  if (!valid.ok) return valid

  let bitmap: BrandPhotoBitmap | null = null
  try {
    const size = await deps.readSize(file)
    if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width < 1 || size.height < 1) {
      return { ok: false, message: BRAND_PHOTO_COPY.unreadable }
    }
    if (Math.min(size.width, size.height) < MIN_EDGE) {
      return { ok: false, message: BRAND_PHOTO_COPY.tooSmall }
    }

    const fitted = fitWithin(size.width, size.height, MAX_EDGE)
    bitmap = await deps.decode(file, {
      imageOrientation: 'from-image',
      resizeWidth: fitted.width,
      resizeHeight: fitted.height,
      resizeQuality: 'high',
    })
    if (bitmap.width < 1 || bitmap.height < 1) {
      return { ok: false, message: BRAND_PHOTO_COPY.unreadable }
    }

    let frame = { width: bitmap.width, height: bitmap.height }
    for (let pass = 0; pass < MAX_ENCODE_PASSES; pass += 1) {
      if (pass > 0) {
        const nextLong = Math.max(1, Math.round(Math.max(frame.width, frame.height) * 0.8))
        frame = fitWithin(bitmap.width, bitmap.height, nextLong)
      }
      const ctx = deps.createCanvas(frame.width, frame.height)
      paint(ctx, bitmap, frame.width, frame.height)
      const blob = await deps.encode(ctx, JPEG_QUALITY)
      if (!blob) return { ok: false, message: BRAND_PHOTO_COPY.unreadable }
      if (blob.size <= MAX_JPEG_BYTES) return { ok: true, blob }
    }
    return { ok: false, message: BRAND_PHOTO_COPY.tooLargeJpeg }
  } catch {
    return { ok: false, message: BRAND_PHOTO_COPY.unreadable }
  } finally {
    bitmap?.close()
  }
}

export async function uploadBrandProductPhoto(input: {
  supabase: BrandPhotoClient
  brandId: number
  file: File
  moderate: BrandPhotoModerate
  prepare?: typeof prepareBrandPhoto
  newId?: () => string
}): Promise<BrandPhotoUploaded> {
  const prepare = input.prepare ?? prepareBrandPhoto
  const newId = input.newId ?? (() => crypto.randomUUID())
  try {
    const prepared = await prepare(input.file)
    if (!prepared.ok) return prepared
    const holdingPath = brandHoldingPath(input.brandId, newId())
    const { error } = await input.supabase.storage.from('brand-assets').upload(holdingPath, prepared.blob, {
      upsert: false,
      contentType: 'image/jpeg',
    })
    if (error) return { ok: false, message: describeBrandPhotoError('upload_failed') }
    const moderated = await input.moderate({ holdingPath })
    if (!moderated.ok) return { ok: false, message: describeBrandPhotoError(moderated.code) }
    return {
      ok: true,
      storagePath: moderated.storagePath,
      publicUrl: moderated.publicUrl,
    }
  } catch {
    return { ok: false, message: describeBrandPhotoError(null) }
  }
}

function browserDeps(): BrandPhotoDeps {
  return {
    readSize: readImageSize,
    decode: decodeScaled,
    createCanvas: browserCanvas,
    encode: encodeJpeg,
  }
}

async function readImageSize(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('unreadable'))
    })
    img.src = url
    await loaded
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('unreadable')
    return { width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function decodeScaled(file: File, options: BrandPhotoDecodeOptions): Promise<BrandPhotoBitmap> {
  return createImageBitmap(file, options)
}

function browserCanvas(width: number, height: number): BrandPhotoContext {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  return {
    canvas,
    get fillStyle() {
      return typeof ctx.fillStyle === 'string' ? ctx.fillStyle : '#fff'
    },
    set fillStyle(value: string) {
      ctx.fillStyle = value
    },
    fillRect: (x, y, w, h) => {
      ctx.fillRect(x, y, w, h)
    },
    drawImage: (image, x, y, w, h) => {
      ctx.drawImage(image as CanvasImageSource, x, y, w, h)
    },
  }
}

function encodeJpeg(ctx: BrandPhotoContext, quality: number): Promise<Blob | null> {
  const canvas = ctx.canvas
  if (!canvas) return Promise.resolve(null)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}
