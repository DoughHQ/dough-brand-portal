'use client'

import { useMemo } from 'react'
import { useAudiencePanelState } from '@/components/studies/audience/useAudiencePanelState'
import { useAudienceReferenceData } from '@/components/studies/audience/useAudienceReferenceData'
import { useBoxQualifierEstimate } from '@/components/studies/audience/useBoxQualifierEstimate'
import { audienceSummaryChips } from '@/lib/box/audienceSummary'
import type { BoxEligibilityDraft, BoxStudyDraft } from '@/lib/box/types'

export function useBoxAudience(
  draft: BoxStudyDraft,
  onChange: (next: BoxStudyDraft) => void,
) {
  const eligibility = draft.eligibility
  const panelState = useAudiencePanelState(eligibility)
  const referenceData = useAudienceReferenceData(
    eligibility.qualifyingTaxonomyNodeId,
    'box',
  )
  const estimate = useBoxQualifierEstimate(draft)
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

  function patch(next: Partial<BoxEligibilityDraft>) {
    onChange({
      ...draft,
      eligibility: { ...eligibility, ...next },
    })
  }

  return { eligibility, panelState, referenceData, estimate, summaryChips, patch }
}
