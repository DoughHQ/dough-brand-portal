import type { AdminQueueBadges } from '@/lib/adminHome/types'

export type NavIcon =
  | 'home'
  | 'readiness'
  | 'report'
  | 'groups'
  | 'impersonate'
  | 'corrections'
  | 'ownership'
  | 'applications'
  | 'boxes'
  | 'safety'
  | 'studies'
  | 'products'
  | 'prototypes'
  | 'categories'
  | 'reports'
  | 'moon'
  | 'sun'
  | 'logout'
  | 'search'
  | 'chevron'
  | 'settings'

export type NavItem = {
  label: string
  href: string
  icon: NavIcon
  badge?: keyof AdminQueueBadges
  prefetch?: boolean
}
export type NavSection = { group: string; items: NavItem[] }
