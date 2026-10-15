import type { ComponentProps } from 'react'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import type { BrandProofAskCount } from '@/lib/transparency/proofAskCounts'
import type InventoryGroups from './InventoryGroups'
import type { LocalRow } from './types'
import type { StudioChaptersState } from './useStudioChapters'
import type useTransparencyStudio from './useTransparencyStudio'

export type ChapterProps = {
  studio: ReturnType<typeof useTransparencyStudio>
  chapters: StudioChaptersState
  ingredientStatement: string | null
  pcfAsk: BrandProofAskCount | null
  saveRow: (field: ProofSubMetricRow, row: LocalRow) => Promise<void>
  inventoryProps: Omit<ComponentProps<typeof InventoryGroups>, 'groups' | 'forceGroupLabel'>
}
