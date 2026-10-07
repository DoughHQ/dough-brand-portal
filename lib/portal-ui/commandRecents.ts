import type { CommandSearchItem } from './commandSearch'

const STORAGE_KEY = 'dough.portal.commandRecents.v1'
const MAX_RECENTS = 8

export type CommandRecentItem = CommandSearchItem & {
  visitedAt: number
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseRecents(raw: string | null): CommandRecentItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: CommandRecentItem[] = []
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : null
      const label = typeof r.label === 'string' ? r.label : null
      const href = typeof r.href === 'string' ? r.href : null
      const group = typeof r.group === 'string' ? r.group : 'Recent'
      const visitedAt =
        typeof r.visitedAt === 'number' && Number.isFinite(r.visitedAt)
          ? r.visitedAt
          : Date.now()
      if (!id || !label || !href) continue
      if (href.startsWith('http') || href.includes('://')) continue
      out.push({
        id,
        label,
        href,
        group,
        keywords: typeof r.keywords === 'string' ? r.keywords : undefined,
        draftId: typeof r.draftId === 'string' ? r.draftId : undefined,
        visitedAt,
      })
    }
    return out
  } catch {
    return []
  }
}

export function listCommandRecents(): CommandRecentItem[] {
  if (!canUseStorage()) return []
  return parseRecents(window.localStorage.getItem(STORAGE_KEY)).slice(0, MAX_RECENTS)
}

/** Recents as command items (group forced to Recent for empty-state display). */
export function commandRecentsAsItems(): CommandSearchItem[] {
  return listCommandRecents().map((r) => ({
    id: `recent-${r.id}`,
    label: r.label,
    href: r.href,
    group: 'Recent',
    keywords: r.keywords,
    draftId: r.draftId,
  }))
}

export function pushCommandRecent(item: Omit<CommandSearchItem, 'group'> & { group?: string }): void {
  if (!canUseStorage()) return
  if (!item.href || item.href.startsWith('http')) return
  const next: CommandRecentItem = {
    id: item.id.replace(/^recent-/, ''),
    label: item.label,
    href: item.href,
    group: item.group ?? 'Recent',
    keywords: item.keywords,
    draftId: item.draftId,
    visitedAt: Date.now(),
  }
  const prev = listCommandRecents().filter(
    (r) => r.id !== next.id && r.href !== next.href,
  )
  const merged = [next, ...prev].slice(0, MAX_RECENTS)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // quota / private mode — ignore
  }
}

/** Record a path visit from layout navigation (no draft). */
export function recordPathVisit(args: {
  pathname: string
  label: string
  group?: string
}): void {
  const href = args.pathname.split('?')[0] || args.pathname
  if (!href || href === '/') return
  // Skip noise: auth, callbacks, very deep edit steps without titles
  if (href.startsWith('/login') || href.startsWith('/auth')) return
  pushCommandRecent({
    id: `path-${href}`,
    label: args.label,
    href,
    group: args.group ?? 'Pages',
  })
}
