'use client'

import { useEffect, useState } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import { boxRiskNodeIds, type BoxTaxonomyRisk } from '@/lib/box/risk'
import { checkBoxTaxonomyRiskAction } from '../boxReadActions'

/** taxonomy_box_risk for the box category and seats, refetched when they change. */
export function useBoxTaxonomyRisk(draft: BoxStudyDraft): BoxTaxonomyRisk {
  const [taxonomyRisk, setTaxonomyRisk] = useState<BoxTaxonomyRisk>({ status: 'idle' })
  const riskNodeKey = boxRiskNodeIds(draft).join(',')

  useEffect(() => {
    const ids = riskNodeKey ? riskNodeKey.split(',').map(Number) : []
    if (ids.length === 0) {
      setTaxonomyRisk({ status: 'idle' })
      return
    }
    let cancelled = false
    setTaxonomyRisk({ status: 'checking' })
    checkBoxTaxonomyRiskAction(ids)
      .then((res) => {
        if (!cancelled) setTaxonomyRisk(res.ok ? res.risk : { status: 'unavailable' })
      })
      .catch(() => {
        if (!cancelled) setTaxonomyRisk({ status: 'unavailable' })
      })
    return () => {
      cancelled = true
    }
  }, [riskNodeKey])

  return taxonomyRisk
}
