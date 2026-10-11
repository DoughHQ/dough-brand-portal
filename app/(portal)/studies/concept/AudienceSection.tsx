'use client'

import { useMemo } from 'react'
import AudienceSummary from '@/components/studies/audience/AudienceSummary'
import CategoryRequirementPanel from '@/components/studies/audience/CategoryRequirementPanel'
import NarrowingPanel from '@/components/studies/audience/NarrowingPanel'
import { optionalAffordance } from '@/components/studies/audience/styles'
import { useAudiencePanelState } from '@/components/studies/audience/useAudiencePanelState'
import { useAudienceReferenceData } from '@/components/studies/audience/useAudienceReferenceData'
import {
  audienceSummaryChips,
  isOpenAudience,
} from '@/lib/concept/audienceSummary'
import type {
  ConceptEligibilityDraft,
  ConceptStudyDraft,
} from '@/lib/concept/types'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import {
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
  disabled?: boolean
  disabledReason?: string | null
}

export default function AudienceSection({
  draft,
  onChange,
  error,
  disabled,
  disabledReason,
}: Props) {
  const eligibility = draft.eligibility
  const panelState = useAudiencePanelState(eligibility)
  const referenceData = useAudienceReferenceData(
    eligibility.qualifyingTaxonomyNodeId,
    'concept'
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
    ]
  )

  function patch(next: Partial<ConceptEligibilityDraft>) {
    onChange({
      ...draft,
      eligibility: { ...eligibility, ...next },
    })
  }

  return (
    <section
      id={CONCEPT_ANCHORS.audience}
      style={{
        ...sectionCard,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <div style={sectionEyebrow}>Section 4 · Audience</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Who qualifies
      </h2>
      <p style={{ ...sectionHelp, marginBottom: 12 }}>
        Optional filters on who can take this study. Concept studies have no
        “tried this product” gate — nobody has tried a concept that doesn’t
        exist yet.
      </p>
      <p style={optionalAffordance}>
        All filters are optional. Leave them blank to let anyone take the study.
      </p>
      <AudienceSummary
        open={isOpenAudience(draft)}
        chips={summaryChips}
      />

      {disabled && disabledReason ? (
        <p
          role="status"
          style={{
            margin: '0 0 18px',
            fontSize: 13,
            color: 'var(--ink-50)',
            background: 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
          }}
        >
          {disabledReason}
        </p>
      ) : null}

      <NarrowingPanel
        anchorId={CONCEPT_ANCHORS.audienceStates}
        eligibility={eligibility}
        dietaryGroups={referenceData.dietaryGroups}
        dietaryStatus={referenceData.dietaryStatus}
        patch={patch}
        narrowOpen={panelState.narrowOpen}
        narrowSet={panelState.narrowSet}
        onNarrowOpenChange={panelState.setNarrowOpen}
        dietaryOpen={panelState.dietaryOpen}
        onDietaryOpenChange={panelState.setDietaryOpen}
        stateLabel="US states"
        stateHelp="Leave empty to include respondents in any state."
        dietarySubject="Respondent"
        accountAgeHelp="Guards against fresh accounts."
      />

      <CategoryRequirementPanel
        anchorId={CONCEPT_ANCHORS.audienceCategoryBars}
        eligibility={eligibility}
        studyTaxonomyNodeId={draft.taxonomyNodeId}
        qualifyingNode={referenceData.qualifyingNode}
        setQualifyingNode={referenceData.setQualifyingNode}
        patch={patch}
        categoryOpen={panelState.categoryOpen}
        onCategoryOpenChange={panelState.setCategoryOpen}
        intro="Require real experience in a category before someone can take the study. Level comes from completed product loops — it can’t be farmed by spamming battles."
        categoryHelp="Can be any level — a broad L1/L2 sums breadth across its subcategories, an L3 measures depth in one. The category does nothing until you set a level, tries, or battle bar below."
        showMinTries
      />

      {error ? (
        <p
          role="alert"
          style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--red)' }}
        >
          {error}
        </p>
      ) : null}
    </section>
  )
}
