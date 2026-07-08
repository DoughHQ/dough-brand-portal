'use client'

import { useState } from 'react'
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

export default function PortalLayoutClient({
  brand,
  portalUser,
  subscription,
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

  const sidebarBrandName = isAdmin
    ? (isImpersonating && impersonatedBrandName ? impersonatedBrandName : 'Platform view')
    : (brand?.brand_name ?? 'Brand')

  const sidebarBrandInitial = isAdmin && isImpersonating && impersonatedBrandName
    ? impersonatedBrandName[0]
    : (brand?.brand_name[0] ?? 'P')

  async function handleSignOut() {
    if (isImpersonating) {
      await exitImpersonationAction()
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function exitImpersonation() {
    setExiting(true)
    try {
      const result = await exitImpersonationAction()
      if (!result.ok) return
      router.refresh()
      router.push('/dashboard')
    } finally {
      setExiting(false)
    }
  }

  return (
    <div className={dark ? 'dark' : ''} style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)', fontFamily: 'var(--font-sans)' }}>

      <aside style={{ width: 220, minWidth: 220, background: 'var(--white)', borderRight: '1px solid var(--ink-10)', display: 'flex', flexDirection: 'column', position: 'fixed', inset: '0 auto 0 0', zIndex: 200 }}>

        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--ink-10)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--sage)', letterSpacing: '-0.3px' }}>
            dough<span style={{ color: 'var(--ink-30)', fontWeight: 400 }}>.</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ink-30)', marginTop: 2 }}>Brand Intelligence</div>
        </div>

        <div style={{ margin: '12px 10px', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--surface-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--sage)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 500, color: 'white', flexShrink: 0 }}>
            {sidebarBrandInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sidebarBrandName}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 400 }}>{subscription?.plan ?? 'Trial'} · {claimedCount} SKU{claimedCount !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {isAdmin && (
          <div style={{
            margin: '0 10px 4px',
            padding: '8px 10px',
            borderRadius: 'var(--r-sm)',
            background: isImpersonating ? 'var(--amber-pale)' : 'transparent',
            border: isImpersonating ? '1px solid rgba(192,120,24,0.2)' : '1px solid transparent',
          }}>
            {isImpersonating && impersonatedBrandName ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                    Viewing as brand
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>
                    {impersonatedBrandName}
                  </div>
                </div>
                <button
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
            ) : (
              <div style={{ fontSize: 11, color: 'var(--ink-30)', fontWeight: 400 }}>
                Admin · Platform view
              </div>
            )}
          </div>
        )}

        <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            { label: 'Studies',       href: '/studies' },
            { label: 'Dashboard',     href: '/dashboard' },
            { label: 'Momentum',      href: '/momentum' },
            { label: 'Products',      href: '/products' },
            { label: 'Who Loves You', href: '/audience' },
            { label: 'Occasions',     href: '/occasions' },
            { label: 'Launch IHUT',   href: '/ihut' },
            { label: 'Reports',       href: '/reports' },
            ...(isAdmin ? [{ label: 'Corrections', href: '/admin/corrections' }] : []),
          ].map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 10px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active ? 'var(--sage)' : 'var(--ink-50)',
                  background: active ? 'var(--sage-pale)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.12s var(--ease), color 0.12s var(--ease)',
                }}
              >
                {item.label}
                {item.label === 'Products' && claimedCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: 'var(--amber)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '1px 6px',
                    borderRadius: 10,
                  }}>
                    {claimedCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--ink-10)', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div onClick={() => setDark(!dark)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 400, color: 'var(--ink-50)', cursor: 'pointer' }}>
            {dark ? 'Light mode' : 'Dark mode'}
          </div>
          <div onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 400, color: 'var(--ink-50)', cursor: 'pointer' }}>
            Sign out
          </div>
        </div>

      </aside>

      <main style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
      </main>

    </div>
  )
}
