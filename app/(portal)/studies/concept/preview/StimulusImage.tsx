'use client'

import { useEffect, useState } from 'react'
import { isDisplayableImageUrl } from '@/lib/concept/stimuliStorage'

type Props = {
  src: string | null | undefined
  alt: string
  unavailable?: boolean
  placeholderClassName?: string
}

/** Renders a signed / catalog URL only. Raw storage refs never become src. */
export default function StimulusImage({
  src,
  alt,
  unavailable,
  placeholderClassName = 'cpw-tile-ph',
}: Props) {
  const url = isDisplayableImageUrl(src) ? src!.trim() : null
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [url])

  const show = !!url && unavailable !== true && !failed
  if (!show) {
    return <span className={placeholderClassName}>No image</span>
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed storage / catalog URL
    <img src={url} alt={alt} onError={() => setFailed(true)} />
  )
}
