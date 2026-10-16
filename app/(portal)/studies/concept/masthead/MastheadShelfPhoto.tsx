'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'

export default function MastheadShelfPhoto({
  imageRef,
  src,
  letter,
}: {
  imageRef?: string | null
  src?: string | null
  letter: string
}) {
  const [url, setUrl] = useState<string | null>(src ?? null)
  useEffect(() => {
    if (src) {
      setUrl(src)
      return
    }
    if (!imageRef) {
      setUrl(null)
      return
    }
    let cancelled = false
    const supabase = createClient()
    void resolveStimuliPreviewUrl(supabase, imageRef).then((next) => {
      if (!cancelled) setUrl(next)
    })
    return () => {
      cancelled = true
    }
  }, [imageRef, src])

  return (
    <span className="cb-masthead-photo">
      {url ? (
        // Study media can use remote catalog URLs that must not be server-fetched.
        // eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo
        <img src={url} alt="" />
      ) : (
        <span className="cb-masthead-letter" aria-hidden>
          {letter}
        </span>
      )}
    </span>
  )
}
