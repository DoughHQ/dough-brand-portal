import type { CommandSearchItem } from '@/lib/portal-ui'

export type CommandItem = CommandSearchItem

export type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandItem[]
  /** Optional remote search (products / studies / reports / drafts / categories). */
  searchRemote?: (query: string) => Promise<CommandItem[]>
  /** Empty-query bootstrap: drafts + categories. */
  bootstrapRemote?: () => Promise<CommandItem[]>
  /** Needed to hydrate server drafts from ⌘K. */
  effectiveBrandId?: number | null
}

export const GROUP_ORDER = [
  'Recent',
  'Drafts',
  'Studies',
  'Products',
  'Categories',
  'Reports',
  'Overview',
  'Catalog',
  'Research',
  'Account',
  'Category',
  'Ops',
]
