'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { PortalUser } from '@/lib/queries'
import type { AdminQueueBadges } from '@/lib/adminHome/types'
import { exitImpersonationAction } from './admin/impersonation/actions'
import './portalLayout.css'

interface PortalLayoutClientProps {
  /** From get_brand_portal_chrome — never a full brand/subscription hydrate. */
  brandName: string | null
  portalUser: PortalUser
  /** Active catalog products for workspace chrome label / Products badge. */
  catalogProductCount?: number
  queueBadges?: AdminQueueBadges
  isAdmin: boolean
  isImpersonating: boolean
  impersonatedBrandName: string | null
  children: React.ReactNode
}

type NavIcon =
  | 'home'
  | 'readiness'
  | 'report'
  | 'groups'
  | 'impersonate'
  | 'corrections'
  | 'ownership'
  | 'applications'
  | 'boxes'
  | 'studies'
  | 'products'
  | 'categories'
  | 'reports'
  | 'moon'
  | 'sun'
  | 'logout'

type NavItem = {
  label: string
  href: string
  icon: NavIcon
  badge?: keyof AdminQueueBadges
  prefetch?: boolean
}
type NavSection = { group: string; items: NavItem[] }

function NavGlyph({ name }: { name: NavIcon }) {
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg className="portal-nav-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {name === 'home' ? <path d="M4 11l8-7 8 7v8H4v-8zM9 19v-6h6v6" {...stroke} /> : null}
      {name === 'readiness' ? <path d="M4 19V9l8-6 8 6v10H4z" {...stroke} /> : null}
      {name === 'report' ? (
        <>
          <path d="M7 4h8l4 4v12H7z" {...stroke} />
          <path d="M15 4v4h4M10 12h6M10 16h4" {...stroke} />
        </>
      ) : null}
      {name === 'groups' ? (
        <>
          <circle cx="8" cy="9" r="2.4" {...stroke} />
          <circle cx="16" cy="9" r="2.4" {...stroke} />
          <path d="M4 18c.6-2.2 2.2-3.4 4-3.4s3.4 1.2 4 3.4M12 18c.6-2.2 2.2-3.4 4-3.4s3.4 1.2 4 3.4" {...stroke} />
        </>
      ) : null}
      {name === 'impersonate' ? (
        <>
          <circle cx="12" cy="8" r="3.2" {...stroke} />
          <path d="M5 19c1.2-3 3.6-4.5 7-4.5S17.8 16 19 19" {...stroke} />
        </>
      ) : null}
      {name === 'corrections' ? <path d="M4 7h16M4 12h16M4 17h10" {...stroke} /> : null}
      {name === 'ownership' ? <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" {...stroke} /> : null}
      {name === 'applications' ? (
        <path d="M8 7h8M8 12h8M8 17h5M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" {...stroke} />
      ) : null}
      {name === 'boxes' ? (
        <>
          <path d="M3 8l9-5 9 5v9l-9 5-9-5V8z" {...stroke} />
          <path d="M12 13V3M3 8l9 5 9-5" {...stroke} />
        </>
      ) : null}
      {name === 'studies' ? <path d="M8 4h8v16H8zM10 8h4" {...stroke} /> : null}
      {name === 'products' ? <path d="M4 7h16M4 12h16M4 17h10" {...stroke} /> : null}
      {name === 'categories' ? <path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" {...stroke} /> : null}
      {name === 'reports' ? <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" {...stroke} /> : null}
      {name === 'moon' ? <path d="M16 4.5A8 8 0 1110 20 6.5 6.5 0 0016 4.5z" {...stroke} /> : null}
      {name === 'sun' ? (
        <>
          <circle cx="12" cy="12" r="4" {...stroke} />
          <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...stroke} />
        </>
      ) : null}
      {name === 'logout' ? (
        <>
          <path d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2" {...stroke} />
          <path d="M4 12h11M12 9l3 3-3 3" {...stroke} />
        </>
      ) : null}
    </svg>
  )
}

const COMPACT_MQ = '(max-width: 880px)'

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href === '/admin/categories') {
    return (
      pathname === '/admin/categories' ||
      /^\/admin\/categories\/[^/]+\/readiness$/.test(pathname)
    )
  }
  if (href === '/categories') {
    return pathname === '/categories' || pathname.startsWith('/categories/')
  }
  return pathname === href || pathname.startsWith(href + '/')
}

function currentSectionLabel(pathname: string, sections: NavSection[]): string {
  for (const section of sections) {
    for (const item of section.items) {
      if (isNavActive(pathname, item.href)) return item.label
    }
  }
  if (pathname.startsWith('/admin/')) return 'Admin'
  return 'Dough'
}

export default function PortalLayoutClient({
  brandName,
  portalUser: _portalUser,
  catalogProductCount = 0,
  queueBadges = { corrections: 0, ownership: 0, applications: 0, boxes: 0 },
  isAdmin,
  isImpersonating,
  impersonatedBrandName,
  children,
}: PortalLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [dark, setDark] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const asideRef = useRef<HTMLElement>(null)

  /** Platform ops shell vs brand intelligence shell. */
  const shell: 'platform' | 'brand' = isAdmin && !isImpersonating ? 'platform' : 'brand'
  const isPlatform = shell === 'platform'

  const sidebarBrandName = isPlatform
    ? 'Platform view'
    : isAdmin && isImpersonating && impersonatedBrandName
      ? impersonatedBrandName
      : (brandName ?? 'Brand')

  const sidebarBrandInitial = isPlatform
    ? 'P'
    : isAdmin && isImpersonating && impersonatedBrandName
      ? impersonatedBrandName[0]
      : (brandName?.[0] ?? 'B')

  const brandNav: NavSection[] = [
    {
      group: 'Workspace',
      items: [
        { label: 'Home', href: '/dashboard', icon: 'home' },
        { label: 'Categories', href: '/categories', icon: 'categories', prefetch: false },
        { label: 'Products', href: '/products', icon: 'products', prefetch: false },
        { label: 'Corrections', href: '/corrections', icon: 'corrections', prefetch: false },
        { label: 'Studies', href: '/studies', icon: 'studies', prefetch: false },
        { label: 'Reports', href: '/reports', icon: 'reports', prefetch: false },
      ],
    },
  ]

  const platformNav: NavSection[] = [
    {
      group: 'Overview',
      items: [{ label: 'Home', href: '/dashboard', icon: 'home' }],
    },
    {
      group: 'Category',
      items: [
        { label: 'Readiness', href: '/admin/categories', icon: 'readiness', prefetch: false },
        { label: 'Report preview', href: '/admin/report-preview', icon: 'report', prefetch: false },
        { label: 'Compare Groups', href: '/admin/compare-groups', icon: 'groups', prefetch: false },
      ],
    },
    {
      group: 'Ops',
      items: [
        { label: 'Impersonate', href: '/admin/impersonate', icon: 'impersonate', prefetch: false },
        { label: 'Corrections', href: '/admin/corrections', icon: 'corrections', badge: 'corrections', prefetch: false },
        { label: 'Ownership', href: '/admin/ownership-corrections', icon: 'ownership', badge: 'ownership', prefetch: false },
        { label: 'Applications', href: '/admin/brand-applications', icon: 'applications', badge: 'applications', prefetch: false },
        { label: 'Boxes', href: '/admin/boxes', icon: 'boxes', badge: 'boxes', prefetch: false },
        { label: 'Studies', href: '/studies', icon: 'studies', prefetch: false },
        { label: 'Products', href: '/products', icon: 'products', prefetch: false },
      ],
    },
  ]

  const navSections = isPlatform ? platformNav : brandNav
  const sectionLabel = currentSectionLabel(pathname, navSections)
  const showImpersonationStrip = isAdmin && isImpersonating && !!impersonatedBrandName
  /** Drawer is off-canvas only in compact mode; keep it focusable on desktop. */
  const drawerInert = isCompact && !navOpen

  // Keep closed compact drawer out of the tab order (inert).
  useEffect(() => {
    const el = asideRef.current
    if (!el) return
    if (drawerInert) el.setAttribute('inert', '')
    else el.removeAttribute('inert')
  }, [drawerInert])

  const closeNav = useCallback(() => setNavOpen(false), [])

  // Close drawer on route change
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  // Track compact viewport; close drawer when leaving it. Escape while open.
  useEffect(() => {
    const mq = window.matchMedia(COMPACT_MQ)
    setIsCompact(mq.matches)
    function onMqChange(e: MediaQueryListEvent) {
      setIsCompact(e.matches)
      if (!e.matches) setNavOpen(false)
    }
    mq.addEventListener('change', onMqChange)

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      mq.removeEventListener('change', onMqChange)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // Body scroll lock while drawer is open
  useEffect(() => {
    if (!navOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [navOpen])

  async function handleSignOut() {
    if (isImpersonating) {
      await exitImpersonationAction()
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function exitImpersonation() {
    setExiting(true)
    const t0 = performance.now()
    try {
      const result = await exitImpersonationAction()
      if (!result.ok) return
      // Action already refreshSession()'d once — skip router.refresh() to avoid
      // re-rendering the brand shell before navigating to platform Home.
      router.push('/dashboard')
      if (process.env.NODE_ENV === 'development') {
        console.log(`[perf] exit.client.total: ${Math.round(performance.now() - t0)}ms`)
      }
    } finally {
      setExiting(false)
    }
  }

  return (
    <div className={`portal-shell${dark ? ' dark' : ''}${navOpen ? ' is-nav-open' : ''}`}>
      <header className="portal-topbar">
        <div className="portal-topbar-row">
          <button
            type="button"
            className="portal-menu-btn"
            aria-expanded={navOpen}
            aria-controls="portal-nav-drawer"
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span className="portal-menu-stroke" aria-hidden />
            <span className="portal-menu-stroke" aria-hidden />
            <span className="portal-menu-stroke" aria-hidden />
          </button>
          <div className="portal-topbar-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="portal-topbar-mark"
              src="/dough-mark.png"
              alt=""
              width={28}
              height={28}
            />
            <span className="portal-topbar-section">{sectionLabel}</span>
          </div>
          <div className="portal-topbar-chip" aria-hidden>
            {sidebarBrandInitial}
          </div>
        </div>
        {showImpersonationStrip ? (
          <div className="portal-topbar-impersonation">
            <span className="portal-topbar-impersonation-label">
              Viewing as <strong>{impersonatedBrandName}</strong>
            </span>
            <button
              type="button"
              className="portal-topbar-impersonation-exit"
              onClick={() => void exitImpersonation()}
              disabled={exiting}
            >
              {exiting ? '…' : 'Exit'}
            </button>
          </div>
        ) : null}
      </header>

      <button
        type="button"
        className="portal-nav-scrim"
        aria-label="Close menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={closeNav}
      />

      <div className="portal-body">
        <aside
          ref={asideRef}
          id="portal-nav-drawer"
          className="portal-aside"
          aria-label="Portal navigation"
          aria-hidden={drawerInert ? true : undefined}
        >
          <div className="portal-mark">
            <div className="portal-mark-lockup">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="portal-mark-icon"
                src="/dough-mark.png"
                alt=""
                width={36}
                height={36}
              />
              <div>
                <div className="portal-mark-name">Dough</div>
                <div className="portal-mark-sub">
                  {isPlatform ? 'Platform' : 'Brand Intelligence'}
                </div>
              </div>
            </div>
          </div>

          <div className="portal-workspace">
            <div className="portal-workspace-mark">{sidebarBrandInitial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="portal-workspace-name">{sidebarBrandName}</div>
              <div className="portal-workspace-meta">
                {isPlatform
                  ? 'Ops'
                  : `Brand workspace · ${catalogProductCount} product${catalogProductCount !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {showImpersonationStrip ? (
            <div className="portal-impersonation">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="portal-impersonation-label">Viewing as brand</div>
                  <div className="portal-impersonation-name">{impersonatedBrandName}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  <Link href="/admin/impersonate" className="portal-impersonation-link">
                    Switch
                  </Link>
                  <button
                    type="button"
                    onClick={() => void exitImpersonation()}
                    disabled={exiting}
                    className="portal-impersonation-btn"
                  >
                    {exiting ? '…' : 'Exit'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <nav className="portal-nav">
            {navSections.map((section) => (
              <div key={section.group}>
                <div className="portal-nav-group-label">{section.group}</div>
                <div className="portal-nav-items">
                  {section.items.map((item) => {
                    const active = isNavActive(pathname, item.href)
                    const badge =
                      item.badge && isPlatform
                        ? queueBadges[item.badge]
                        : !isPlatform && item.label === 'Products'
                          ? catalogProductCount
                          : 0
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        prefetch={item.prefetch}
                        className={`portal-nav-link${active ? ' is-active' : ''}`}
                      >
                        <NavGlyph name={item.icon} />
                        <span className="portal-nav-label">{item.label}</span>
                        {badge > 0 ? (
                          <span className={`portal-nav-count${item.badge ? ' is-queue' : ''}`}>
                            {badge}
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="portal-foot">
            <button type="button" className="portal-foot-btn" onClick={() => setDark(!dark)}>
              <NavGlyph name={dark ? 'sun' : 'moon'} />
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            <button type="button" className="portal-foot-btn" onClick={() => void handleSignOut()}>
              <NavGlyph name="logout" />
              Logout
            </button>
          </div>
        </aside>

        <main className="portal-main">{children}</main>
      </div>
    </div>
  )
}
