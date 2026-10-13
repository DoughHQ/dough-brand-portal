import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MARKETING_ORIGIN,
  PORTAL_ORIGIN,
  PRODUCT_NAME,
  SUPPORT_EMAIL,
  getPortalAppUrl,
  normalizePortalOrigin,
} from '@/lib/brand'

describe('lib/brand', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sets display name to Runoff (Train B)', () => {
    expect(PRODUCT_NAME).toBe('Runoff')
  })

  it('owns marketing origin and re-exports support email', () => {
    expect(MARKETING_ORIGIN).toBe('https://www.itsarunoff.com')
    expect(SUPPORT_EMAIL).toBe('hello@itsarunoff.com')
  })

  it('owns canonical portal origin', () => {
    expect(PORTAL_ORIGIN).toBe('https://brands.itsarunoff.com')
  })

  it('rewrites legacy godough portal host to PORTAL_ORIGIN', () => {
    expect(normalizePortalOrigin('https://brands.godough.co')).toBe(PORTAL_ORIGIN)
    expect(normalizePortalOrigin('https://brands.godough.co/')).toBe(PORTAL_ORIGIN)
    expect(normalizePortalOrigin('https://brands.itsarunoff.com/')).toBe(
      'https://brands.itsarunoff.com',
    )
    expect(normalizePortalOrigin('')).toBeNull()
  })

  it('getPortalAppUrl prefers env, never returns godough', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://brands.godough.co')
    expect(getPortalAppUrl()).toBe(PORTAL_ORIGIN)
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://brands.itsarunoff.com/')
    expect(getPortalAppUrl()).toBe('https://brands.itsarunoff.com')
  })

  it('getPortalAppUrl falls back to PORTAL_ORIGIN without window/env', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(getPortalAppUrl()).toBe(PORTAL_ORIGIN)
  })
})
