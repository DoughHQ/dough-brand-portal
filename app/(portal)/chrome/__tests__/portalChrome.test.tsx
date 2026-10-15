import { PRODUCT_NAME } from '@/lib/brand'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PortalAside } from '../PortalAside'
import { PortalDesktopTopbar } from '../PortalDesktopTopbar'
import { PortalImpersonationBar } from '../PortalImpersonationBar'
import { PortalMobileTopbar } from '../PortalMobileTopbar'
import { brandNav, currentSectionLabel, isNavActive } from '../portalNav'
import type { PortalChrome } from '../usePortalLayout'

function chrome(overrides: Record<string, unknown> = {}) {
  return {
    navOpen: false,
    setNavOpen: () => {},
    sectionLabel: 'Home',
    openPalette: () => {},
    showImpersonationStrip: true,
    impersonatedBrandName: 'Acme',
    exitImpersonation: async () => {},
    exiting: false,
    asideRef: { current: null },
    drawerInert: false,
    isPlatform: false,
    workspaceHref: undefined,
    sidebarBrandInitial: 'A',
    sidebarBrandName: 'Acme',
    isImpersonating: false,
    catalogProductCount: 2,
    navSections: brandNav,
    pathname: '/dashboard',
    queueBadges: { safety: 0, corrections: 0, ownership: 0, applications: 0, boxes: 0 },
    modKey: '⌘',
    accountRef: { current: null },
    accountOpen: true,
    setAccountOpen: () => {},
    accountName: 'Ada',
    dark: false,
    setDark: () => {},
    handleSignOut: async () => {},
    ...overrides,
  } as unknown as PortalChrome
}

describe('portal nav', () => {
  it('treats the dashboard href as an exact match', () => {
    expect(isNavActive('/dashboard', '/dashboard')).toBe(true)
    expect(isNavActive('/dashboard/extra', '/dashboard')).toBe(false)
    expect(isNavActive('/products/1', '/products')).toBe(true)
    expect(isNavActive('/admin/categories/snacks/readiness', '/admin/categories')).toBe(true)
    expect(isNavActive('/categories/snacks', '/categories')).toBe(true)
  })

  it('labels the active section and falls back to the product name', () => {
    expect(currentSectionLabel('/products', brandNav)).toBe('Products')
    expect(currentSectionLabel('/admin/safety', brandNav)).toBe('Admin')
    expect(currentSectionLabel('/nowhere', [])).toBe(PRODUCT_NAME)
  })
})

describe('portal chrome', () => {
  it('renders the mobile topbar, drawer, and desktop account menu', () => {
    const html = renderToStaticMarkup(
      <>
        <PortalMobileTopbar {...chrome()} />
        <PortalAside {...chrome()} />
        <PortalDesktopTopbar {...chrome()} />
        <PortalImpersonationBar {...chrome()} />
      </>,
    )
    expect(html).toContain('portal-topbar-mobile')
    expect(html).toContain('Viewing as <strong>Acme</strong>')
    expect(html).toContain('Brand Intelligence')
    expect(html).toContain('Brand workspace · 2 products')
    expect(html).toContain('portal-nav-link is-active')
    expect(html).toContain('Search pages, studies, products…')
    expect(html).toContain('Log out')
    expect(html).toContain('Exit brand')
    expect(html).toContain('Press <kbd>⌘K</kbd> to search')
  })
})
