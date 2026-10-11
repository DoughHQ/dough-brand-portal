'use client'

import { useMemo } from 'react'
import AudienceSummary from '@/components/studies/audience/AudienceSummary'
import BoxExperienceTier from '@/components/studies/audience/BoxExperienceTier'
import CategoryRequirementPanel from '@/components/studies/audience/CategoryRequirementPanel'
import NarrowingPanel from '@/components/studies/audience/NarrowingPanel'
import { optionalAffordance, subHelp } from '@/components/studies/audience/styles'
import { useAudiencePanelState } from '@/components/studies/audience/useAudiencePanelState'
import { useAudienceReferenceData } from '@/components/studies/audience/useAudienceReferenceData'
import { useBoxQualifierEstimate } from '@/components/studies/audience/useBoxQualifierEstimate'
import { audienceSummaryChips } from '@/lib/box/audienceSummary'
import type { BoxEligibilityDraft, BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS, isOpenAudience } from '@/lib/box/validity'
import { summarizeBoxAudience } from '@/lib/box/builderSummaries'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
  sectionDone?: boolean
}

export default function AudienceSection({
  draft,
  onChange,
  error,
  sectionDone = false,
}: Props) {
  const eligibility = draft.eligibility
  const panelState = useAudiencePanelState(eligibility)
  const referenceData = useAudienceReferenceData(
    eligibility.qualifyingTaxonomyNodeId,
    'box'
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
    ]
  )

  function patch(next: Partial<BoxEligibilityDraft>) {
    onChange({
      ...draft,
      eligibility: { ...eligibility, ...next },
    })
  }

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.audience}
      title="Audience"
      summary={summarizeBoxAudience(draft)}
      done={sectionDone}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <p style={{ ...optionalAffordance, margin: 0 }}>
          All filters are optional. Leave them blank to let anyone qualify.
        </p>
        <div
          aria-live="polite"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: estimate.count?.below_viable_floor
              ? 'var(--amber)'
              : 'var(--ink-80)',
            opacity:
              estimate.loading && estimate.qualifyingUsers != null ? 0.55 : 1,
            lineHeight: 1.2,
          }}
        >
          {estimate.headline}
        </div>
      </div>

      <AudienceSummary
        open={isOpenAudience(draft)}
        chips={summaryChips}
      />
      <p style={{ ...subHelp, margin: '0 0 24px', maxWidth: 560 }}>
        Live estimate against current users — grows as more people join
      </p>
      {estimate.count?.warning ? (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--amber)',
            margin: '-12px 0 24px',
            lineHeight: 1.4,
            maxWidth: 560,
          }}
        >
          {estimate.count.warning}
        </p>
      ) : null}

      <BoxExperienceTier draft={draft} onChange={onChange} />

      <NarrowingPanel
        anchorId={BOX_ANCHORS.audienceStates}
        eligibility={eligibility}
        dietaryGroups={referenceData.dietaryGroups}
        dietaryStatus={referenceData.dietaryStatus}
        patch={patch}
        narrowOpen={panelState.narrowOpen}
        narrowSet={panelState.narrowSet}
        onNarrowOpenChange={panelState.setNarrowOpen}
        dietaryOpen={panelState.dietaryOpen}
        onDietaryOpenChange={panelState.setDietaryOpen}
        stateLabel="Ship-to states"
        stateHelp="Leave empty to ship anywhere."
        dietarySubject="Claimant"
        accountAgeHelp="Guards against fresh accounts made just to claim."
      />

      <CategoryRequirementPanel
        anchorId={BOX_ANCHORS.audienceCategoryBars}
        eligibility={eligibility}
        studyTaxonomyNodeId={draft.taxonomyNodeId}
        qualifyingNode={referenceData.qualifyingNode}
        setQualifyingNode={referenceData.setQualifyingNode}
        patch={patch}
        categoryOpen={panelState.categoryOpen}
        onCategoryOpenChange={panelState.setCategoryOpen}
        intro="Require real experience in a category before someone can claim. Level comes from completed product loops — it can’t be farmed by spamming battles."
        categoryHelp="Can be any level — a broad L1/L2 sums breadth across its subcategories, an L3 measures depth in one. The category does nothing until you set a level or battle bar below."
        showMinTries={false}
      />

      {error ? (
        <p
          role="alert"
          style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--red)' }}
        >
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}
