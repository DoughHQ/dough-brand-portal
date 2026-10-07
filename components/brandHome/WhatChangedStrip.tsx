'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import {
  captureHomeBaseline,
  diffWhatChanged,
  readHomeBaseline,
  writeHomeBaseline,
  type WhatChangedItem,
} from '@/lib/brandHome/whatChanged'

export default function WhatChangedStrip({
  brandId,
  model,
}: {
  brandId: number
  model: BrandHomeModel
}) {
  const [items, setItems] = useState<WhatChangedItem[]>([])

  useEffect(() => {
    if (!Number.isFinite(brandId) || brandId <= 0) return
    const next = captureHomeBaseline(model)
    const prev = readHomeBaseline(brandId)
    setItems(diffWhatChanged(prev, next, model))
    writeHomeBaseline(brandId, next)
    // One baseline per Home visit — avoid clearing chips on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model captured on mount
  }, [brandId])

  if (items.length === 0) return null

  return (
    <section className="bh-changed portal-panel" aria-label="What changed">
      <p className="bh-changed-eyebrow">Since last visit</p>
      <ul className="bh-changed-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="bh-changed-chip">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
