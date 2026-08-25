'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { PortalUser, Brand, BrandSubscription } from '@/lib/queries'
import { exitImpersonationAction } from './admin/impersonation/actions'

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

  const asideStyle: CSSProperties = {
    width: 'var(--portal-sidebar-w)',
    minWidth: 'var(--portal-sidebar-w)',
    background: 'var(--sage-dark)',
    borderRight: '1px solid rgba(250, 248, 243, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    inset: '0 auto 0 0',
    zIndex: 200,
  }

  const muted = 'rgba(250, 248, 243, 0.45)'
  const ink = 'var(--cream, #FAF8F3)'
  const inkSoft = 'rgba(250, 248, 243, 0.72)'
  const groupColor = 'rgba(250, 248, 243, 0.4)'
  const borderSoft = 'rgba(250, 248, 243, 0.1)'
  const chipBg = 'rgba(250, 248, 243, 0.08)'

  return (
    <div
      className={dark ? 'dark' : ''}
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--surface)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <aside style={asideStyle}>
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${borderSoft}` }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--cream, #FAF8F3)',
              letterSpacing: '-0.3px',
            }}
          >
            dough
            <span style={{ color: muted, fontWeight: 400 }}>.</span>
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              color: muted,
              marginTop: 2,
            }}
          >
            {isPlatform ? 'Platform' : 'Brand Intelligence'}
          </div>
        </div>

        <div
          style={{
            margin: '12px 10px',
            padding: '10px',
            borderRadius: 'var(--portal-radius-control)',
            background: chipBg,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'rgba(250, 248, 243, 0.15)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: 13,
              fontWeight: 500,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {sidebarBrandInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {sidebarBrandName}
            </div>
            <div
              style={{
                fontSize: 10,
                color: muted,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                fontWeight: 400,
              }}
            >
              {isPlatform
                ? 'Ops'
                : `Brand workspace · ${claimedCount} SKU${claimedCount !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {isAdmin && isImpersonating && impersonatedBrandName ? (
          <div
            style={{
              margin: '0 10px 4px',
              padding: '8px 10px',
              borderRadius: 'var(--portal-radius-control)',
              background: 'var(--amber-pale)',
              border: '1px solid rgba(192,120,24,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--amber)',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}
                >
                  Viewing as brand
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink)',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {impersonatedBrandName}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <Link
                  href="/admin/impersonate"
                  style={{
                    fontSize: 11,
                    color: 'var(--amber)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-sans)',
                    padding: '2px 6px',
                  }}
                >
                  Switch
                </Link>
                <button
                  type="button"
                  onClick={exitImpersonation}
                  disabled={exiting}
                  style={{
                    fontSize: 11,
                    color: 'var(--amber)',
                    background: 'transparent',
                    border: 'none',
                    cursor: exiting ? 'default' : 'pointer',
                    fontFamily: 'var(--font-sans)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {exiting ? '…' : 'Exit'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <nav
          style={{
            flex: 1,
            padding: '10px 10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            overflowY: 'auto',
          }}
        >
          {navSections.map((section) => (
            <div key={section.group}>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: groupColor,
                  padding: '0 10px',
                  marginBottom: 8,
                }}
              >
                {section.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map((item) => {
                  const active = isNavActive(pathname, item.href)
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: '9px 10px',
                        borderRadius: 'var(--portal-radius-control)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        color: active ? 'var(--cream, #FAF8F3)' : inkSoft,
                        background: active ? 'rgba(250, 248, 243, 0.12)' : 'transparent',
                        textDecoration: 'none',
                        transition: 'background 0.12s var(--ease)',
                        boxShadow: active ? 'inset 3px 0 0 var(--cream, #FAF8F3)' : 'none',
                      }}
                    >
                      {item.label}
                      {!isPlatform && item.label === 'Products' && claimedCount > 0 ? (
                        <span
                          style={{
                            marginLeft: 'auto',
                            background: 'var(--amber)',
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 500,
                            padding: '1px 6px',
                            borderRadius: 999,
                          }}
                        >
                          {claimedCount}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          style={{
            padding: '12px 10px',
            borderTop: `1px solid ${borderSoft}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <div
            onClick={() => setDark(!dark)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 10px',
              borderRadius: 'var(--portal-radius-control)',
              fontSize: 12,
              fontWeight: 400,
              color: muted,
              cursor: 'pointer',
            }}
          >
            {dark ? 'Light mode' : 'Dark mode'}
          </div>
          <div
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 10px',
              borderRadius: 'var(--portal-radius-control)',
              fontSize: 12,
              fontWeight: 400,
              color: muted,
              cursor: 'pointer',
            }}
          >
            Sign out
          </div>
        </div>
      </aside>

      <main
        style={{
          marginLeft: 'var(--portal-sidebar-w)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  )
}
