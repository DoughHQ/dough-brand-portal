'use client'

import { useMemo } from 'react'
import { useAudiencePanelState } from '@/components/studies/audience/useAudiencePanelState'
import { useAudienceReferenceData } from '@/components/studies/audience/useAudienceReferenceData'
import { audienceSummaryChips } from '@/lib/concept/audienceSummary'
import type {
  ConceptEligibilityDraft,
  ConceptStudyDraft,
} from '@/lib/concept/types'

export function useConceptAudience(
  draft: ConceptStudyDraft,
  onChange: (next: ConceptStudyDraft) => void,
) {
  const eligibility = draft.eligibility
  const panelState = useAudiencePanelState(eligibility)
  const referenceData = useAudienceReferenceData(
    eligibility.qualifyingTaxonomyNodeId,
    'concept',
  )
  const summaryChips = useMemo(
    () =>
      audienceSummaryChips(draft, {
        dietaryLabels: referenceData.dietaryLabels,
        categoryLabel:
          referenceData.qualifyingNode?.node_name_display ??
          eligibility.qualifyingNodeLabel,
      }),
    [
      draft,
      eligibility.qualifyingNodeLabel,
      referenceData.dietaryLabels,
      referenceData.qualifyingNode,
    ],
  )

  function patch(next: Partial<ConceptEligibilityDraft>) {
    onChange({
      ...draft,
      eligibility: { ...eligibility, ...next },
    })
  }

  return { eligibility, panelState, referenceData, summaryChips, patch }
}
