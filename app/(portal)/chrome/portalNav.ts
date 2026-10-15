import { PRODUCT_NAME } from '@/lib/brand'
import type { NavSection } from './navModel'

export const COMPACT_MQ = '(max-width: 880px)'

export function isNavActive(pathname: string, href: string): boolean {
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

export function currentSectionLabel(pathname: string, sections: NavSection[]): string {
  for (const section of sections) {
    for (const item of section.items) {
      if (isNavActive(pathname, item.href)) return item.label
    }
  }
  if (pathname.startsWith('/admin/')) return 'Admin'
  return PRODUCT_NAME
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}

export const brandNav: NavSection[] = [
  {
    group: 'Overview',
    items: [{ label: 'Home', href: '/dashboard', icon: 'home' }],
  },
  {
    group: 'Catalog',
    items: [
      { label: 'Categories', href: '/categories', icon: 'categories', prefetch: false },
      { label: 'Products', href: '/products', icon: 'products', prefetch: false },
      { label: 'Prototypes', href: '/prototypes', icon: 'prototypes', prefetch: false },
    ],
  },
  {
    group: 'Research',
    items: [
      { label: 'Studies', href: '/studies', icon: 'studies', prefetch: false },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Corrections', href: '/corrections', icon: 'corrections', prefetch: false },
    ],
  },
]

export const platformNav: NavSection[] = [
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
      { label: 'Safety', href: '/admin/safety', icon: 'safety', badge: 'safety', prefetch: false },
      { label: 'Corrections', href: '/admin/corrections', icon: 'corrections', badge: 'corrections', prefetch: false },
      { label: 'Ownership', href: '/admin/ownership-corrections', icon: 'ownership', badge: 'ownership', prefetch: false },
      { label: 'Applications', href: '/admin/brand-applications', icon: 'applications', badge: 'applications', prefetch: false },
      { label: 'Boxes', href: '/admin/boxes', icon: 'boxes', badge: 'boxes', prefetch: false },
    ],
  },
  {
    group: 'Research',
    items: [
      { label: 'Studies', href: '/studies', icon: 'studies', prefetch: false },
      { label: 'Products', href: '/products', icon: 'products', prefetch: false },
      { label: 'Reports', href: '/reports', icon: 'reports', prefetch: false },
    ],
  },
]
