import CategoryRequirementPanel from '@/components/studies/audience/CategoryRequirementPanel'
import type {
  AudienceEligibility,
  PatchAudienceEligibility,
} from '@/components/studies/audience/types'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import { BOX_ANCHORS } from '@/lib/box/validity'

export default function BoxAudienceCategory({
  eligibility,
  studyTaxonomyNodeId,
  qualifyingNode,
  setQualifyingNode,
  patch,
  categoryOpen,
  onCategoryOpenChange,
}: {
  eligibility: AudienceEligibility
  studyTaxonomyNodeId: number | null
  qualifyingNode: TaxonomyNodeInfo | null
  setQualifyingNode: (node: TaxonomyNodeInfo | null) => void
  patch: PatchAudienceEligibility
  categoryOpen: boolean
  onCategoryOpenChange: (open: boolean) => void
}) {
  return (
    <CategoryRequirementPanel
      anchorId={BOX_ANCHORS.audienceCategoryBars}
      eligibility={eligibility}
      studyTaxonomyNodeId={studyTaxonomyNodeId}
      qualifyingNode={qualifyingNode}
      setQualifyingNode={setQualifyingNode}
      patch={patch}
      categoryOpen={categoryOpen}
      onCategoryOpenChange={onCategoryOpenChange}
      intro="Require real experience in a category before someone can claim. Level comes from completed product loops — it can’t be farmed by spamming battles."
      categoryHelp="Can be any level — a broad L1/L2 sums breadth across its subcategories, an L3 measures depth in one. The category does nothing until you set a level or battle bar below."
      showMinTries={false}
    />
  )
}
