import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  commandRecentsAsItems,
  filterCommandItems,
  pushCommandRecent,
} from '@/lib/portal-ui'
import { openServerStudyDraft } from '@/lib/studies/openServerDraft'
import type { CommandItem, Props } from './paletteModel'

export type CommandPaletteState = ReturnType<typeof useCommandPalette>

export function useCommandPalette({
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

  return {
    inputRef,
    query,
    setQuery,
    active,
    setActive,
    remoteLoading,
    openingDraft,
    filtered,
    close,
    go,
  }
}
