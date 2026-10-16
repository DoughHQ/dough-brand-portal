'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { readinessLabel } from '@/lib/prototypes/readiness'
import { resolvePrototypePreviewUrl } from '@/lib/prototypes/storage'
import type { PrototypeReadiness } from '@/lib/prototypes/types'

export function ReadinessPill({ readiness }: { readiness: PrototypeReadiness }) {
  return (
    <span className={`proto-pill proto-pill-${readiness}`}>{readinessLabel(readiness)}</span>
  )
}

export function CardArt({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let cancelled = false
    const supabase = createClient()
    void resolvePrototypePreviewUrl(supabase, path).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (!url) return <div className="proto-card-art proto-card-art-empty" aria-hidden />
  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo
    <img src={url} alt="" className="proto-card-art" />
  )
}
