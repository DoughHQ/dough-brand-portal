'use client'

import { useEffect, useState } from 'react'
import { getTaxonomyNodeAction } from '@/app/(portal)/studies/audienceActions'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'

export function useBoxSetup(taxonomyNodeId: number | null) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)

  useEffect(() => {
    if (taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(taxonomyNodeId).then((n) => {
      if (!cancelled) setNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [taxonomyNodeId])

  return { node, setNode }
}
