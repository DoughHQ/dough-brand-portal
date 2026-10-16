import { describe, expect, it, vi } from 'vitest'
import {
  BRAND_PHOTO_COPY,
  brandHoldingPath,
  describeBrandPhotoError,
  fitWithin,
  isBrandPublishedPath,
  prepareBrandPhoto,
  uploadBrandProductPhoto,
  validateBrandPhotoFile,
  type BrandPhotoBitmap,
  type BrandPhotoContext,
  type BrandPhotoDeps,
} from '../brandPhoto'

const UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const SHA = 'ab'.repeat(32)

function photo(name: string, type: string, size = 128): File {
  return { name, type, size } as File
}

describe('validateBrandPhotoFile', () => {
  it('accepts jpeg, jpg, png and webp by type and by extension', () => {
    expect(validateBrandPhotoFile(photo('a.jpg', 'image/jpeg')).ok).toBe(true)
    expect(validateBrandPhotoFile(photo('a.jpg', 'image/jpg')).ok).toBe(true)
    expect(validateBrandPhotoFile(photo('a.png', 'image/png')).ok).toBe(true)
    expect(validateBrandPhotoFile(photo('a.webp', 'image/webp')).ok).toBe(true)
    expect(validateBrandPhotoFile(photo('a.JPG', '')).ok).toBe(true)
    expect(validateBrandPhotoFile(photo('a.jpeg', '')).ok).toBe(true)
    expect(validateBrandPhotoFile(photo('a.PNG', '')).ok).toBe(true)
    expect(validateBrandPhotoFile(photo('a.WEBP', '')).ok).toBe(true)
  })

  it('names HEIC by type and by filename', () => {
    expect(validateBrandPhotoFile(photo('a.jpg', 'image/heic'))).toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.heic,
    })
    expect(validateBrandPhotoFile(photo('a.HEIC', 'image/heif'))).toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.heic,
    })
    expect(validateBrandPhotoFile(photo('shot.heic', ''))).toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.heic,
    })
  })

  it('refuses gif and svg', () => {
    expect(validateBrandPhotoFile(photo('a.gif', 'image/gif')).ok).toBe(false)
    expect(validateBrandPhotoFile(photo('a.svg', 'image/svg+xml'))).toMatchObject({
      message: BRAND_PHOTO_COPY.format,
    })
  })

  it('refuses a file one byte over 25 MB', () => {
    const result = validateBrandPhotoFile(photo('a.jpg', 'image/jpeg', 25 * 1024 * 1024 + 1))
    expect(result).toEqual({ ok: false, message: BRAND_PHOTO_COPY.tooLargeSource })
    expect(validateBrandPhotoFile(photo('a.jpg', 'image/jpeg', 25 * 1024 * 1024)).ok).toBe(true)
  })
})

describe('fitWithin', () => {
  it('scales the long edge down and never up', () => {
    expect(fitWithin(4000, 3000, 2400)).toEqual({ width: 2400, height: 1800 })
    expect(fitWithin(3000, 4000, 2400)).toEqual({ width: 1800, height: 2400 })
    expect(fitWithin(1200, 900, 2400)).toEqual({ width: 1200, height: 900 })
    expect(fitWithin(500, 400, 2400)).toEqual({ width: 500, height: 400 })
  })
})

describe('brandHoldingPath', () => {
  it('builds the holding path for a brand', () => {
    expect(brandHoldingPath(20040698, UUID)).toBe(`20040698/holding/${UUID}.jpg`)
  })

  it('throws unless the brand id and id are safe', () => {
    expect(() => brandHoldingPath(0, UUID)).toThrow()
    expect(() => brandHoldingPath(-1, UUID)).toThrow()
    expect(() => brandHoldingPath(1.5, UUID)).toThrow()
    expect(() => brandHoldingPath(20040698, 'not-a-uuid')).toThrow()
    expect(() => brandHoldingPath(20040698, UUID.toUpperCase())).toThrow()
  })
})

describe('isBrandPublishedPath', () => {
  const good = `20040698/products/${SHA}.jpg`

  it('accepts only this brand’s content-addressed jpeg', () => {
    expect(isBrandPublishedPath(good, 20040698)).toBe(true)
    expect(isBrandPublishedPath(`20040699/products/${SHA}.jpg`, 20040698)).toBe(false)
    expect(isBrandPublishedPath(`20040698/products/${SHA.toUpperCase()}.jpg`, 20040698)).toBe(false)
    expect(isBrandPublishedPath(`20040698/products/${'a'.repeat(63)}.jpg`, 20040698)).toBe(false)
    expect(isBrandPublishedPath(`20040698/products/${'a'.repeat(65)}.jpg`, 20040698)).toBe(false)
    expect(isBrandPublishedPath(`20040698/products/${SHA}.png`, 20040698)).toBe(false)
    expect(isBrandPublishedPath(`20040698/holding/${SHA}.jpg`, 20040698)).toBe(false)
    expect(isBrandPublishedPath(`20040698/products/${UUID}.jpg`, 20040698)).toBe(false)
    expect(isBrandPublishedPath(`${good}/x`, 20040698)).toBe(false)
  })
})

function bitmap(width: number, height: number, close = vi.fn()): BrandPhotoBitmap {
  return { width, height, close }
}

function recorder(): {
  canvases: { width: number; height: number; calls: string[] }[]
  createCanvas: BrandPhotoDeps['createCanvas']
} {
  const canvases: { width: number; height: number; calls: string[] }[] = []
  return {
    canvases,
    createCanvas(width, height) {
      const calls: string[] = []
      const ctx: BrandPhotoContext = {
        canvas: null,
        fillStyle: '',
        fillRect(x, y, w, h) {
          calls.push(`fillRect:${x},${y},${w},${h}`)
        },
        drawImage() {
          calls.push('drawImage')
        },
      }
      Object.defineProperty(ctx, 'fillStyle', {
        configurable: true,
        set(value: string) {
          calls.push(`fillStyle:${value}`)
        },
        get() {
          return ''
        },
      })
      canvases.push({ width, height, calls })
      return ctx
    },
  }
}

function deps(overrides: Partial<BrandPhotoDeps> = {}): BrandPhotoDeps & {
  canvases: { width: number; height: number; calls: string[] }[]
  close: ReturnType<typeof vi.fn>
} {
  const close = vi.fn()
  const { canvases, createCanvas } = recorder()
  return {
    canvases,
    close,
    readSize: vi.fn(async () => ({ width: 6000, height: 4000 })),
    decode: vi.fn(async () => bitmap(2400, 1600, close)),
    createCanvas,
    encode: vi.fn(async () => ({ size: 1024 }) as Blob),
    ...overrides,
  }
}

describe('prepareBrandPhoto', () => {
  const file = photo('pack.png', 'image/png')

  it('refuses a short edge under 800 and accepts 800', async () => {
    const tiny = deps({ readSize: vi.fn(async () => ({ width: 799, height: 4000 })) })
    await expect(prepareBrandPhoto(file, tiny)).resolves.toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.tooSmall,
    })
    expect(tiny.decode).not.toHaveBeenCalled()

    const close = vi.fn()
    const enough = deps({
      readSize: vi.fn(async () => ({ width: 800, height: 800 })),
      decode: vi.fn(async () => bitmap(800, 800, close)),
    })
    await expect(prepareBrandPhoto(file, enough)).resolves.toMatchObject({ ok: true })
    expect(close).toHaveBeenCalledOnce()
  })

  it('decodes straight to the fitted size', async () => {
    const d = deps()
    await prepareBrandPhoto(file, d)
    expect(d.decode).toHaveBeenCalledWith(file, {
      imageOrientation: 'from-image',
      resizeWidth: 2400,
      resizeHeight: 1600,
      resizeQuality: 'high',
    })
  })

  it('fills the canvas white before drawing', async () => {
    const d = deps()
    await prepareBrandPhoto(file, d)
    const calls = d.canvases[0]?.calls ?? []
    const fill = calls.indexOf('fillStyle:#fff')
    const rect = calls.indexOf('fillRect:0,0,2400,1600')
    const draw = calls.indexOf('drawImage')
    expect(fill).toBeGreaterThanOrEqual(0)
    expect(fill).toBeLessThan(rect)
    expect(rect).toBeLessThan(draw)
  })

  it('encodes once at 0.85 when the jpeg fits', async () => {
    const d = deps()
    const result = await prepareBrandPhoto(file, d)
    expect(result.ok).toBe(true)
    expect(d.encode).toHaveBeenCalledTimes(1)
    expect(d.encode).toHaveBeenCalledWith(expect.anything(), 0.85)
    expect(d.close).toHaveBeenCalledOnce()
  })

  it('redraws 20% smaller, still at 0.85, when the first jpeg is over 9.5 MB', async () => {
    const d = deps({
      encode: vi
        .fn()
        .mockResolvedValueOnce({ size: 10 * 1024 * 1024 } as Blob)
        .mockResolvedValueOnce({ size: 1024 } as Blob),
    })
    const result = await prepareBrandPhoto(file, d)
    expect(result.ok).toBe(true)
    expect(d.encode).toHaveBeenCalledTimes(2)
    expect(d.encode).toHaveBeenNthCalledWith(2, expect.anything(), 0.85)
    expect(d.canvases.map((c) => [c.width, c.height])).toEqual([
      [2400, 1600],
      [1920, 1280],
    ])
    for (const canvas of d.canvases) {
      expect(canvas.calls.indexOf('fillStyle:#fff')).toBeLessThan(canvas.calls.indexOf('drawImage'))
    }
    expect(d.close).toHaveBeenCalledOnce()
  })

  it('stops after three shrinks', async () => {
    const d = deps({
      encode: vi.fn(async () => ({ size: 10 * 1024 * 1024 }) as Blob),
    })
    await expect(prepareBrandPhoto(file, d)).resolves.toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.tooLargeJpeg,
    })
    expect(d.encode).toHaveBeenCalledTimes(4)
    expect(d.canvases.map((c) => c.width)).toEqual([2400, 1920, 1536, 1229])
    expect(d.close).toHaveBeenCalledOnce()
  })

  it('treats a null blob, a size failure and a decode failure as unreadable', async () => {
    const empty = deps({ encode: vi.fn(async () => null) })
    await expect(prepareBrandPhoto(file, empty)).resolves.toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.unreadable,
    })
    expect(empty.close).toHaveBeenCalledOnce()

    const unread = deps({ readSize: vi.fn(async () => Promise.reject(new Error('no'))) })
    await expect(prepareBrandPhoto(file, unread)).resolves.toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.unreadable,
    })
    expect(unread.decode).not.toHaveBeenCalled()

    const broken = deps({ decode: vi.fn(async () => Promise.reject(new Error('no'))) })
    await expect(prepareBrandPhoto(file, broken)).resolves.toEqual({
      ok: false,
      message: BRAND_PHOTO_COPY.unreadable,
    })
  })
})

describe('uploadBrandProductPhoto', () => {
  const file = photo('pack.png', 'image/png')
  const published = `20040698/products/${SHA}.jpg`
  const holding = `20040698/holding/${UUID}.jpg`

  function client() {
    const upload = vi.fn(
      async (): Promise<{ error: { message?: string } | null }> => ({ error: null }),
    )
    const from = vi.fn(() => ({ upload }))
    return { supabase: { storage: { from } }, upload, from }
  }

  it('uploads the holding jpeg and returns the moderated path unchanged', async () => {
    const { supabase, upload, from } = client()
    const moderate = vi.fn(async () => ({
      ok: true as const,
      storagePath: published,
      publicUrl: 'https://example.test/pack.jpg',
    }))
    const result = await uploadBrandProductPhoto({
      supabase,
      brandId: 20040698,
      file,
      moderate,
      prepare: async () => ({ ok: true, blob: new Blob(['jpeg']) }),
      newId: () => UUID,
    })
    expect(from).toHaveBeenCalledWith('brand-assets')
    expect(upload).toHaveBeenCalledWith(holding, expect.any(Blob), {
      upsert: false,
      contentType: 'image/jpeg',
    })
    expect(moderate).toHaveBeenCalledTimes(1)
    expect(moderate).toHaveBeenCalledWith({ holdingPath: holding })
    expect(result).toEqual({
      ok: true,
      storagePath: published,
      publicUrl: 'https://example.test/pack.jpg',
    })
  })

  it('does not moderate when the upload fails', async () => {
    const { supabase, upload } = client()
    upload.mockResolvedValueOnce({ error: { message: 'denied' } })
    const moderate = vi.fn()
    const result = await uploadBrandProductPhoto({
      supabase,
      brandId: 20040698,
      file,
      moderate,
      prepare: async () => ({ ok: true, blob: new Blob(['jpeg']) }),
      newId: () => UUID,
    })
    expect(result).toEqual({ ok: false, message: BRAND_PHOTO_COPY.uploadFailed })
    expect(moderate).not.toHaveBeenCalled()
  })

  it('maps moderation codes', async () => {
    const prepare = async () => ({ ok: true as const, blob: new Blob(['jpeg']) })
    const standards = await uploadBrandProductPhoto({
      supabase: client().supabase,
      brandId: 20040698,
      file,
      moderate: async () => ({ ok: false, code: 'community_standards' }),
      prepare,
      newId: () => UUID,
    })
    expect(standards).toEqual({ ok: false, message: BRAND_PHOTO_COPY.community })

    const changed = await uploadBrandProductPhoto({
      supabase: client().supabase,
      brandId: 20040698,
      file,
      moderate: async () => ({ ok: false, code: 'changed' }),
      prepare,
      newId: () => UUID,
    })
    expect(changed).toEqual({ ok: false, message: BRAND_PHOTO_COPY.changed })
  })

  it('does not upload when prepare fails', async () => {
    const { supabase, upload } = client()
    const result = await uploadBrandProductPhoto({
      supabase,
      brandId: 20040698,
      file,
      moderate: vi.fn(),
      prepare: async () => ({ ok: false, message: 'nope' }),
      newId: () => UUID,
    })
    expect(result).toEqual({ ok: false, message: 'nope' })
    expect(upload).not.toHaveBeenCalled()
  })

  it('turns a bad id into the fallback and uploads nothing', async () => {
    const { supabase, upload } = client()
    const result = await uploadBrandProductPhoto({
      supabase,
      brandId: 20040698,
      file,
      moderate: vi.fn(),
      prepare: async () => ({ ok: true, blob: new Blob(['jpeg']) }),
      newId: () => 'NOT-A-UUID',
    })
    expect(result).toEqual({ ok: false, message: BRAND_PHOTO_COPY.fallback })
    expect(upload).not.toHaveBeenCalled()
  })
})

describe('describeBrandPhotoError', () => {
  it('covers every code and the fallback', () => {
    expect(describeBrandPhotoError('community_standards')).toBe(BRAND_PHOTO_COPY.community)
    expect(describeBrandPhotoError('rate_limited')).toBe(BRAND_PHOTO_COPY.rateLimited)
    expect(describeBrandPhotoError('not_authorized')).toBe(BRAND_PHOTO_COPY.notAuthorized)
    expect(describeBrandPhotoError('session_expired')).toBe(BRAND_PHOTO_COPY.sessionExpired)
    expect(describeBrandPhotoError('unsupported_format')).toBe(BRAND_PHOTO_COPY.format)
    expect(describeBrandPhotoError('too_large')).toBe(BRAND_PHOTO_COPY.tooLargeJpeg)
    expect(describeBrandPhotoError('upload_failed')).toBe(BRAND_PHOTO_COPY.uploadFailed)
    expect(describeBrandPhotoError('not_found')).toBe(BRAND_PHOTO_COPY.uploadFailed)
    expect(describeBrandPhotoError('changed')).toBe(BRAND_PHOTO_COPY.changed)
    expect(describeBrandPhotoError('publish_failed')).toBe(BRAND_PHOTO_COPY.fallback)
    expect(describeBrandPhotoError(null)).toBe(BRAND_PHOTO_COPY.fallback)
    expect(describeBrandPhotoError('nope', 'custom')).toBe('custom')
  })
})
