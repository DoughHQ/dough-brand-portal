import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const getPortalBrandScope = vi.fn()
const portalAccountNeedsPassword = vi.fn()
const redirect = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT:${to}`)
})

vi.mock('next/navigation', () => ({ redirect: (to: string) => redirect(to) }))
vi.mock('@/lib/portal/getPortalBrandScope', () => ({
  getPortalBrandScope: () => getPortalBrandScope(),
}))
vi.mock('@/lib/portal/needsPassword.server', () => ({
  portalAccountNeedsPassword: () => portalAccountNeedsPassword(),
}))
vi.mock('@/lib/adminHome/fetchAdminHomeSnapshot.server', () => ({
  getAdminQueueBadges: async () => ({
    safety: 0,
    corrections: 0,
    ownership: 0,
    applications: 0,
    boxes: 0,
  }),
}))
vi.mock('@/lib/brandHome/fetchBrandPortalChrome.server', () => ({
  getBrandPortalChrome: async () => ({ brandName: 'Acme', catalogProductCount: 0 }),
}))
vi.mock('../../app/(portal)/PortalLayoutClient', () => ({ default: () => null }))
vi.mock('../../app/(portal)/components/LegacyBrandIdGate', () => ({ default: () => null }))

import PortalLayout from '../../app/(portal)/layout'

async function redirectTarget(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run()
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.startsWith('NEXT_REDIRECT:')) return message.slice('NEXT_REDIRECT:'.length)
    throw err
  }
  return null
}

const scope = {
  portalUser: { role: 'brand_admin', brand_id: 1 },
  isImpersonating: false,
  effectiveBrandId: 1,
  impersonatedBrandId: null,
}

beforeEach(() => {
  getPortalBrandScope.mockReset()
  portalAccountNeedsPassword.mockReset()
  redirect.mockClear()
})

describe('(portal) layout password gate', () => {
  it('still sends signed-out visitors to /login (scope check runs first)', async () => {
    getPortalBrandScope.mockResolvedValue(null)
    expect(await redirectTarget(() => PortalLayout({ children: null }))).toBe('/login')
    expect(portalAccountNeedsPassword).not.toHaveBeenCalled()
  })

  it('redirects accounts that still need a password to /welcome/password', async () => {
    getPortalBrandScope.mockResolvedValue(scope)
    portalAccountNeedsPassword.mockResolvedValue(true)
    expect(await redirectTarget(() => PortalLayout({ children: null }))).toBe('/welcome/password')
  })

  it('renders the portal when no password is pending', async () => {
    getPortalBrandScope.mockResolvedValue(scope)
    portalAccountNeedsPassword.mockResolvedValue(false)
    expect(await redirectTarget(() => PortalLayout({ children: null }))).toBeNull()
  })
})
