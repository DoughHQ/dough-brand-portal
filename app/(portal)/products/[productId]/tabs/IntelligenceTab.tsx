'use client'

import { useMemo } from 'react'
import type { ProductMaster } from '@/lib/productMaster/types'
import { ProductIntelligenceTab } from './ProductDetailTabPanels'
import ProductIntelligencePanel from './ProductIntelligencePanel'
import {
  buildHeadToHeadJobs,
  intelligenceVolumeStats,
  pickHeadlineStanding,
  raterFloorCopy,
} from './intelligencePresentation'

export function IntelligenceTab({ master }: { master: ProductMaster }) {
  const showJobScores = master.compare_groups.results != null
  const intelJobs = useMemo(
    () => buildHeadToHeadJobs(master.compare_groups.eligible, master.compare_groups.results),
    [master.compare_groups.eligible, master.compare_groups.results]
  )
  const intelHeadline = useMemo(() => pickHeadlineStanding(intelJobs), [intelJobs])
  const intelVolume = useMemo(
    () => intelligenceVolumeStats(master.intelligence),
    [master.intelligence]
  )
  const intelFloor = raterFloorCopy(master.intelligence)

  return (
    <ProductIntelligenceTab>
      <ProductIntelligencePanel
        headline={intelHeadline}
        volume={intelVolume}
        floorCopy={intelFloor}
        jobs={intelJobs}
        showJobScores={showJobScores}
        intelligence={master.intelligence}
      />
    </ProductIntelligenceTab>
  )
}
