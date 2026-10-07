'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  commandRecentsAsItems,
  filterCommandItems,
  pushCommandRecent,
  type CommandSearchItem,
} from '@/lib/portal-ui'
import { openServerStudyDraft } from '@/lib/studies/openServerDraft'
import styles from './commandPalette.module.css'

export type CommandItem = CommandSearchItem

type Props = {
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

const GROUP_ORDER = [
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

export function CommandPalette({
  open,
  onOpenChange,
  items,
  searchRemote,
  bootstrapRemote,
  effectiveBrandId,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [remote, setRemote] = useState<CommandItem[]>([])
  const [bootstrap, setBootstrap] = useState<CommandItem[]>([])
  const [recents, setRecents] = useState<CommandItem[]>([])
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [openingDraft, setOpeningDraft] = useState(false)

  const navFiltered = useMemo(
    () => filterCommandItems(items, query),
    [items, query],
  )

  const filtered = useMemo(() => {
    const q = query.trim()
    const seen = new Set<string>()
    const merged: CommandItem[] = []
    const push = (item: CommandItem) => {
      if (seen.has(item.id)) return
      // Also dedupe by href+draftId so recent doesn't duplicate bootstrap
      const key = `${item.draftId ?? ''}|${item.href}|${item.label}`
      if (seen.has(key)) return
      seen.add(item.id)
      seen.add(key)
      merged.push(item)
    }

    if (q.length < 2) {
      for (const item of recents) push(item)
      for (const item of bootstrap) push(item)
      // Keep a short nav hint when idle
      for (const item of navFiltered.slice(0, 6)) push(item)
      return merged
    }

    for (const item of [...remote, ...navFiltered]) push(item)
    return merged
  }, [remote, navFiltered, bootstrap, recents, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    setRemote([])
    setRemoteLoading(false)
    setOpeningDraft(false)
    setRecents(commandRecentsAsItems())
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open || !bootstrapRemote) {
      setBootstrap([])
      return
    }
    let cancelled = false
    void bootstrapRemote()
      .then((rows) => {
        if (!cancelled) setBootstrap(rows)
      })
      .catch(() => {
        if (!cancelled) setBootstrap([])
      })
    return () => {
      cancelled = true
    }
  }, [open, bootstrapRemote])

  useEffect(() => {
    setActive(0)
  }, [query, remote, bootstrap, recents])

  useEffect(() => {
    if (!open || !searchRemote) {
      setRemote([])
      return
    }
    const q = query.trim()
    if (q.length < 2) {
      setRemote([])
      setRemoteLoading(false)
      return
    }
    let cancelled = false
    setRemoteLoading(true)
    const handle = window.setTimeout(() => {
      void searchRemote(q)
        .then((rows) => {
          if (!cancelled) setRemote(rows)
        })
        .catch(() => {
          if (!cancelled) setRemote([])
        })
        .finally(() => {
          if (!cancelled) setRemoteLoading(false)
        })
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [open, query, searchRemote])

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const go = useCallback(
    async (item: CommandItem) => {
      pushCommandRecent(item)
      if (item.draftId) {
        if (!effectiveBrandId) {
          close()
          router.push('/studies')
          return
        }
        setOpeningDraft(true)
        const result = await openServerStudyDraft({
          serverDraftId: item.draftId,
          effectiveBrandId,
        })
        setOpeningDraft(false)
        close()
        if (result.ok) {
          router.push(result.href)
        } else {
          router.push('/studies')
        }
        return
      }
      close()
      router.push(item.href)
    },
    [close, router, effectiveBrandId],
  )

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        const item = filtered[active]
        if (item && !openingDraft) {
          e.preventDefault()
          void go(item)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, active, close, go, openingDraft])

  if (!open) return null

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    ;(acc[item.group] ??= []).push(item)
    return acc
  }, {})

  const orderedGroups = [
    ...GROUP_ORDER.filter((g) => groups[g]?.length),
    ...Object.keys(groups).filter((g) => !GROUP_ORDER.includes(g)),
  ]

  let flatIndex = -1
  const idle = query.trim().length < 2

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Search portal">
      <button type="button" className={styles.scrim} aria-label="Close search" onClick={close} />
      <div className={styles.panel}>
        <div className={styles.searchRow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search studies, drafts, products, categories…"
            aria-autocomplete="list"
            aria-controls="portal-command-list"
          />
          <kbd className={styles.kbd}>esc</kbd>
        </div>
        <div className={styles.list} id="portal-command-list" role="listbox">
          {filtered.length === 0 ? (
            <p className={styles.empty}>
              {remoteLoading || openingDraft
                ? openingDraft
                  ? 'Opening draft…'
                  : 'Searching…'
                : idle
                  ? 'Recent destinations, drafts, and categories appear here'
                  : 'No matches'}
            </p>
          ) : (
            orderedGroups.map((group) => (
              <div key={group} className={styles.group}>
                <div className={styles.groupLabel}>{group}</div>
                {(groups[group] ?? []).map((item) => {
                  flatIndex += 1
                  const index = flatIndex
                  const isActive = index === active
                  return (
                    <button
                      type="button"
                      key={item.id}
                      role="option"
                      aria-selected={isActive}
                      className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ''}`}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => void go(item)}
                      disabled={openingDraft}
                    >
                      <span className={styles.itemLabel}>{item.label}</span>
                      <span className={styles.itemHref}>
                        {item.draftId ? 'Resume draft' : item.href}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
        <div className={styles.footer}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>esc Close</span>
          {remoteLoading || openingDraft ? (
            <span>{openingDraft ? 'Opening…' : 'Searching…'}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function useCommandPaletteHotkey(onOpen: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpen])
}
