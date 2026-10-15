'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { PRODUCT_NAME } from '@/lib/brand'
import { createClient } from '@/lib/supabase'
import type { PortalUser } from '@/lib/queries'
import type { AdminQueueBadges } from '@/lib/adminHome/types'
import { exitImpersonationAction } from '../admin/impersonation/actions'
import type { CommandItem } from '@/components/portal/CommandPalette'
import { useCommandPaletteHotkey } from '@/components/portal/CommandPalette'
import { recordPathVisit } from '@/lib/portal-ui'
import {
  bootstrapPortalCommandAction,
  searchPortalCommandAction,
} from '../searchPortalCommandAction'
import { brandNav, COMPACT_MQ, currentSectionLabel, isMacPlatform, platformNav } from './portalNav'

export function usePortalLayout({
  brandName,
  portalUser,
  catalogProductCount = 0,
  queueBadges = { safety: 0, corrections: 0, ownership: 0, applications: 0, boxes: 0 },
  isAdmin,
  isImpersonating,
  impersonatedBrandName,
  effectiveBrandId = null,
}: {
  brandName: string | null
  portalUser: PortalUser
  catalogProductCount?: number
  queueBadges?: AdminQueueBadges
  isAdmin: boolean
  isImpersonating: boolean
  impersonatedBrandName: string | null
  effectiveBrandId?: number | null
}) {
const router = useRouter()
const pathname = usePathname()
const supabase = createClient()
const [dark, setDark] = useState(() => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('dough.portal.dark') === '1'
  } catch {
    return false
  }
})
const [exiting, setExiting] = useState(false)
const [navOpen, setNavOpen] = useState(false)
const [isCompact, setIsCompact] = useState(false)
const [paletteOpen, setPaletteOpen] = useState(false)
const [accountOpen, setAccountOpen] = useState(false)
const asideRef = useRef<HTMLElement>(null)
const accountRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  try {
    window.localStorage.setItem('dough.portal.dark', dark ? '1' : '0')
  } catch {
    // private mode
  }
}, [dark])

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

const accountName =
  portalUser.display_name?.trim() ||
  (isPlatform ? `${PRODUCT_NAME} admin` : sidebarBrandName)

const navSections = isPlatform ? platformNav : brandNav
const sectionLabel = currentSectionLabel(pathname, navSections)
const showImpersonationStrip = isAdmin && isImpersonating && !!impersonatedBrandName
/** Drawer is off-canvas only in compact mode; keep it focusable on desktop. */
const drawerInert = isCompact && !navOpen
const modKey = isMacPlatform() ? '⌘' : 'Ctrl'

const commandItems: CommandItem[] = useMemo(() => {
  const items: CommandItem[] = []
  for (const section of navSections) {
    for (const item of section.items) {
      items.push({
        id: `${section.group}-${item.href}`,
        label: item.label,
        href: item.href,
        group: section.group,
        keywords: `${item.label} ${section.group}`,
      })
    }
  }
  return items
}, [navSections])

const openPalette = useCallback(() => setPaletteOpen(true), [])
useCommandPaletteHotkey(openPalette)

const searchRemote = useCallback(
  (query: string) => searchPortalCommandAction(query),
  [],
)
const bootstrapRemote = useCallback(
  () => bootstrapPortalCommandAction(),
  [],
)

// Keep closed compact drawer out of the tab order (inert).
useEffect(() => {
  const el = asideRef.current
  if (!el) return
  if (drawerInert) el.setAttribute('inert', '')
  else el.removeAttribute('inert')
}, [drawerInert])

const closeNav = useCallback(() => setNavOpen(false), [])

// Close drawer on route change; record ⌘K recents from nav labels when possible.
useEffect(() => {
  setNavOpen(false)
  setAccountOpen(false)
  if (isPlatform) return
  const path = pathname.split('?')[0] || pathname
  const navHit: { label: string; group: string }[] = [
    { label: 'Home', group: 'Overview' },
    { label: 'Categories', group: 'Catalog' },
    { label: 'Products', group: 'Catalog' },
    { label: 'Prototypes', group: 'Catalog' },
    { label: 'Studies', group: 'Research' },
  ]
  const hrefFor = (label: string) =>
    label === 'Home' ? '/dashboard' : `/${label.toLowerCase()}`
  let label: string | null = null
  let group = 'Pages'
  for (const hit of navHit) {
    const href = hrefFor(hit.label)
    if (path === href || path.startsWith(`${href}/`)) {
      label = hit.label
      group = hit.group
    }
  }
  if (!label) {
    if (path.startsWith('/products/')) {
      label = 'Product'
      group = 'Catalog'
    } else if (path.startsWith('/categories/')) {
      label = 'Category'
      group = 'Catalog'
    } else if (path.includes('/report')) {
      label = 'Report'
      group = 'Research'
    } else if (path.startsWith('/studies/')) {
      label = 'Study'
      group = 'Research'
    }
  }
  if (label) recordPathVisit({ pathname: path, label, group })
}, [pathname, isPlatform])

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
    if (e.key === 'Escape') {
      setNavOpen(false)
      setAccountOpen(false)
    }
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

// Close account menu on outside click
useEffect(() => {
  if (!accountOpen) return
  function onPointer(e: MouseEvent) {
    if (!accountRef.current?.contains(e.target as Node)) {
      setAccountOpen(false)
    }
  }
  window.addEventListener('mousedown', onPointer)
  return () => window.removeEventListener('mousedown', onPointer)
}, [accountOpen])

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
    router.push('/dashboard')
    if (process.env.NODE_ENV === 'development') {
      console.log(`[perf] exit.client.total: ${Math.round(performance.now() - t0)}ms`)
    }
  } finally {
    setExiting(false)
  }
}

const workspaceHref = isPlatform || isAdmin ? '/admin/impersonate' : undefined

  return {
    dark,
    setDark,
    exiting,
    navOpen,
    setNavOpen,
    paletteOpen,
    setPaletteOpen,
    accountOpen,
    setAccountOpen,
    asideRef,
    accountRef,
    isPlatform,
    sidebarBrandName,
    sidebarBrandInitial,
    accountName,
    navSections,
    sectionLabel,
    showImpersonationStrip,
    drawerInert,
    modKey,
    commandItems,
    openPalette,
    searchRemote,
    bootstrapRemote,
    closeNav,
    handleSignOut,
    exitImpersonation,
    workspaceHref,
    catalogProductCount,
    queueBadges,
    pathname,
    impersonatedBrandName,
    isImpersonating,
    effectiveBrandId,
  }
}

export type PortalChrome = ReturnType<typeof usePortalLayout>
