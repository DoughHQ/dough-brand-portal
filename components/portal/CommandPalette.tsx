'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  filterCommandItems,
  type CommandSearchItem,
} from '@/lib/portal-ui/commandSearch'
import styles from './commandPalette.module.css'

export type CommandItem = CommandSearchItem

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandItem[]
}

export function CommandPalette({ open, onOpenChange, items }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const filtered = useMemo(
    () => filterCommandItems(items, query),
    [items, query],
  )

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const go = useCallback(
    (item: CommandItem) => {
      close()
      router.push(item.href)
    },
    [close, router],
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
        if (item) {
          e.preventDefault()
          go(item)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, active, close, go])

  if (!open) return null

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    ;(acc[item.group] ??= []).push(item)
    return acc
  }, {})

  let flatIndex = -1

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
            placeholder="Search pages, studies, products…"
            aria-autocomplete="list"
            aria-controls="portal-command-list"
          />
          <kbd className={styles.kbd}>esc</kbd>
        </div>
        <div className={styles.list} id="portal-command-list" role="listbox">
          {filtered.length === 0 ? (
            <p className={styles.empty}>No matches</p>
          ) : (
            Object.entries(groups).map(([group, groupItems]) => (
              <div key={group} className={styles.group}>
                <div className={styles.groupLabel}>{group}</div>
                {groupItems.map((item) => {
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
                      onClick={() => go(item)}
                    >
                      <span className={styles.itemLabel}>{item.label}</span>
                      <span className={styles.itemHref}>{item.href}</span>
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
