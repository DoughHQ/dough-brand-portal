'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { PortalUser, Brand, BrandSubscription } from '@/lib/queries'
import { exitImpersonationAction } from './admin/impersonation/actions'
import './portalLayout.css'

interface PortalLayoutClientProps {
  brand: Brand | null
  portalUser: PortalUser
  subscription: BrandSubscription | null
  claimedCount: number
  isAdmin: boolean
  isImpersonating: boolean
  impersonatedBrandName: string | null
  children: React.ReactNode
}

type NavItem = { label: string; href: string }
type NavSection = { group: string; items: NavItem[] }

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

export default function PortalLayoutClient({
  brand,
  portalUser: _portalUser,
  subscription: _subscription,
  claimedCount,
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

  /** Platform ops shell vs brand intelligence shell. */
  const shell: 'platform' | 'brand' = isAdmin && !isImpersonating ? 'platform' : 'brand'
  const isPlatform = shell === 'platform'

  const sidebarBrandName = isPlatform
    ? 'Platform view'
    : isAdmin && isImpersonating && impersonatedBrandName
      ? impersonatedBrandName
      : (brand?.brand_name ?? 'Brand')

  const sidebarBrandInitial = isPlatform
    ? 'P'
    : isAdmin && isImpersonating && impersonatedBrandName
      ? impersonatedBrandName[0]
      : (brand?.brand_name[0] ?? 'B')

  const brandNav: NavSection[] = [
    {
      group: 'Workspace',
      items: [
        { label: 'Home', href: '/dashboard' },
        { label: 'Categories', href: '/categories' },
        { label: 'Products', href: '/products' },
        { label: 'Studies', href: '/studies' },
        { label: 'Reports', href: '/reports' },
      ],
    },
  ]

  const platformNav: NavSection[] = [
    {
      group: 'Overview',
      items: [{ label: 'Home', href: '/dashboard' }],
    },
    {
      group: 'Category',
      items: [
        { label: 'Readiness', href: '/admin/categories' },
        { label: 'Report preview', href: '/admin/report-preview' },
        { label: 'Compare Groups', href: '/admin/compare-groups' },
      ],
    },
    {
      group: 'Ops',
      items: [
        { label: 'Impersonate', href: '/admin/impersonate' },
        { label: 'Corrections', href: '/admin/corrections' },
        { label: 'Ownership', href: '/admin/ownership-corrections' },
        { label: 'Applications', href: '/admin/brand-applications' },
        { label: 'Boxes', href: '/admin/boxes' },
        { label: 'Studies', href: '/studies' },
        { label: 'Products', href: '/products' },
      ],
    },
  ]

  const navSections = isPlatform ? platformNav : brandNav

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
    <div className={`portal-shell${dark ? ' dark' : ''}`}>
      <aside className="portal-aside">
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
                : `Brand workspace · ${claimedCount} SKU${claimedCount !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {isAdmin && isImpersonating && impersonatedBrandName ? (
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
                  onClick={exitImpersonation}
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
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`portal-nav-link${active ? ' is-active' : ''}`}
                    >
                      {item.label}
                      {!isPlatform && item.label === 'Products' && claimedCount > 0 ? (
                        <span className="portal-nav-count">{claimedCount}</span>
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
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button type="button" className="portal-foot-btn" onClick={() => void handleSignOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="portal-main">{children}</main>
    </div>
  )
}
