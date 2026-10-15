'use client'

import { useMemo, useState } from 'react'
import type { PrototypeListItem, PrototypeReadiness } from '@/lib/prototypes/types'

export function usePrototypesLibrary(initialItems: PrototypeListItem[]) {
  const [items, setItems] = useState(initialItems)
  const [editing, setEditing] = useState<PrototypeListItem | null | 'new'>(null)
  const [filter, setFilter] = useState<'all' | PrototypeReadiness>('all')

  const readyCount = useMemo(() => items.filter((i) => i.readiness === 'ready').length, [items])
  const needsCount = items.length - readyCount

  const visible = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.readiness === filter)
  }, [filter, items])

  function upsert(row: PrototypeListItem) {
    setItems((prev) => {
      const without = prev.filter((p) => p.id !== row.id)
      return [row, ...without]
    })
  }

  return {
    items,
    setItems,
    editing,
    setEditing,
    filter,
    setFilter,
    readyCount,
    needsCount,
    visible,
    upsert,
  }
}
