'use client'

import { useEffect, useState } from 'react'
import { resolvePrototypePreviewUrl } from '@/lib/prototypes/storage'
import { createClient } from '@/lib/supabase'

export default function PrototypeThumb({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let cancelled = false
    void resolvePrototypePreviewUrl(createClient(), path).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (!url) {
    return (
      <span
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'var(--surface-1)',
          border: '1px solid var(--ink-10)',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={44}
      height={44}
      style={{
        width: 44,
        height: 44,
        objectFit: 'contain',
        borderRadius: 8,
        background: 'var(--surface-1)',
        border: '1px solid var(--ink-10)',
        flexShrink: 0,
      }}
    />
  )
}
