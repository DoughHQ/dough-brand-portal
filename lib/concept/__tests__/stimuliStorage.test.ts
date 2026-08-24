import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  isDisplayableImageUrl,
  objectPathFromSignedUrl,
  resolveStimuliPreviewUrl,
  storageRefToObjectPath,
} from '../stimuliStorage'

afterEach(() => {
  vi.restoreAllMocks()
})

function fakeClient(
  result:
    | { signedUrl: string; error?: null }
    | { signedUrl?: null; error: { message: string } }
) {
  return {
    storage: {
      from: () => ({
        createSignedUrl: async () => ({
          data: result.signedUrl ? { signedUrl: result.signedUrl } : null,
          error: result.error ?? null,
        }),
      }),
    },
  } as never
}

describe('storageRefToObjectPath', () => {
  it('strips the concept-stimuli prefix', () => {
    expect(
      storageRefToObjectPath('concept-stimuli/12/draft-1/C-abc.png')
    ).toBe('12/draft-1/C-abc.png')
  })

  it('accepts a bare brandId object path', () => {
    expect(storageRefToObjectPath('12/draft-1/C-abc.png')).toBe(
      '12/draft-1/C-abc.png'
    )
  })

  it('rejects a filename-only or blob ref', () => {
    expect(storageRefToObjectPath('C-abc.png')).toBeNull()
    expect(storageRefToObjectPath('blob:https://localhost/x')).toBeNull()
  })
})

describe('isDisplayableImageUrl', () => {
  it('accepts catalog https and signed storage URLs', () => {
    expect(isDisplayableImageUrl('https://cdn.example/pack.jpg')).toBe(true)
    expect(
      isDisplayableImageUrl(
        'https://proj.supabase.co/storage/v1/object/sign/concept-stimuli/1/d/C.png?token=abc'
      )
    ).toBe(true)
  })

  it('rejects raw storage refs', () => {
    expect(isDisplayableImageUrl('concept-stimuli/1/d/C.png')).toBe(false)
    expect(isDisplayableImageUrl('1/d/C.png')).toBe(false)
    expect(isDisplayableImageUrl(null)).toBe(false)
  })
})

describe('objectPathFromSignedUrl', () => {
  it('extracts the object path', () => {
    expect(
      objectPathFromSignedUrl(
        'https://proj.supabase.co/storage/v1/object/sign/concept-stimuli/12/draft/C-abc.png?token=xyz'
      )
    ).toBe('12/draft/C-abc.png')
  })
})

describe('resolveStimuliPreviewUrl', () => {
  it('passes catalog https through without signing', async () => {
    const url = await resolveStimuliPreviewUrl(
      fakeClient({ signedUrl: 'https://should-not-use', error: null }),
      'https://cdn.example/product.jpg'
    )
    expect(url).toBe('https://cdn.example/product.jpg')
  })

  it('signs a concept-stimuli storage ref', async () => {
    const signed =
      'https://proj.supabase.co/storage/v1/object/sign/concept-stimuli/12/d/C.png?token=fresh'
    const url = await resolveStimuliPreviewUrl(
      fakeClient({ signedUrl: signed }),
      'concept-stimuli/12/d/C.png'
    )
    expect(url).toBe(signed)
  })

  it('re-signs an existing signed URL from its object path', async () => {
    const incoming =
      'https://proj.supabase.co/storage/v1/object/sign/concept-stimuli/12/d/C.png?token=old'
    const fresh =
      'https://proj.supabase.co/storage/v1/object/sign/concept-stimuli/12/d/C.png?token=fresh'
    const url = await resolveStimuliPreviewUrl(
      fakeClient({ signedUrl: fresh }),
      incoming
    )
    expect(url).toBe(fresh)
  })

  it('returns null and warns when signing a storage ref fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const url = await resolveStimuliPreviewUrl(
      fakeClient({ error: { message: 'Object not found' } }),
      'concept-stimuli/12/d/C.png'
    )
    expect(url).toBeNull()
    expect(warn).toHaveBeenCalled()
  })
})
