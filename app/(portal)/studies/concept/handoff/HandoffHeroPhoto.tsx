'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'

export default function HandoffHeroPhoto({
  imageRef,
  letter,
}: {
  imageRef: string | null
  letter: string
}) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!imageRef) {
      setSrc(null)
      return
    }
    const supabase = createClient()
    void resolveStimuliPreviewUrl(supabase, imageRef).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [imageRef])

  if (!src) {
    return (
      <div className="cb-handoff-letter" aria-hidden>
        {letter}
      </div>
    )
  }
  // Study media can use remote catalog URLs that must not be server-fetched.
  // eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo
  return <img className="cb-handoff-photo" src={src} alt="" />
}
