'use client'

import { useEffect, useMemo, useState } from 'react'
import { listBrandPrototypesAction } from '../../../prototypes/actions'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import { resolvePrototypePreviewUrl } from '@/lib/prototypes/storage'
import { createClient } from '@/lib/supabase'

export function useBoxPrototypePick(
  taken: Set<string>,
  onPick: (item: PrototypeListItem, imageUrl: string | null) => void,
) {
  const [items, setItems] = useState<PrototypeListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pickingId, setPickingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listBrandPrototypesAction().then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setError(res.error)
        setItems([])
        return
      }
      setItems(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const ready = useMemo(
    () => (items ?? []).filter((i) => i.readiness === 'ready' && i.archived_at == null),
    [items]
  )
  const notReady = useMemo(
    () =>
      (items ?? []).filter((i) => i.readiness !== 'ready' && i.archived_at == null),
    [items]
  )

  async function pick(item: PrototypeListItem) {
    if (taken.has(item.id) || item.readiness !== 'ready') return
    setPickingId(item.id)
    const imageUrl = await resolvePrototypePreviewUrl(
      createClient(),
      item.image_paths[0] ?? null
    )
    onPick(item, imageUrl)
    setPickingId(null)
  }

  return { items, error, pickingId, ready, notReady, pick }
}
