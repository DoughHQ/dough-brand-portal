'use client'

import AudienceSummary from '@/components/studies/audience/AudienceSummary'
import BoxExperienceTier from '@/components/studies/audience/BoxExperienceTier'
import type { BoxStudyDraft } from '@/lib/box/types'
import { summarizeBoxAudience } from '@/lib/box/builderSummaries'
import { BOX_ANCHORS, isOpenAudience } from '@/lib/box/validity'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import AudienceEstimateHead from './audience/AudienceEstimateHead'
import AudienceEstimateNote from './audience/AudienceEstimateNote'
import BoxAudienceCategory from './audience/BoxAudienceCategory'
import BoxAudienceNarrowing from './audience/BoxAudienceNarrowing'
import { useBoxAudience } from './audience/useBoxAudience'

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
  const audience = useBoxAudience(draft, onChange)

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.audience}
      title="Audience"
      summary={summarizeBoxAudience(draft)}
      done={sectionDone}
    >
      <AudienceEstimateHead estimate={audience.estimate} />
      <AudienceSummary
        open={isOpenAudience(draft)}
        chips={audience.summaryChips}
      />
      <AudienceEstimateNote estimate={audience.estimate} />
      <BoxExperienceTier draft={draft} onChange={onChange} />
      <BoxAudienceNarrowing
        eligibility={audience.eligibility}
        dietaryGroups={audience.referenceData.dietaryGroups}
        dietaryStatus={audience.referenceData.dietaryStatus}
        patch={audience.patch}
        narrowOpen={audience.panelState.narrowOpen}
        narrowSet={audience.panelState.narrowSet}
        onNarrowOpenChange={audience.panelState.setNarrowOpen}
        dietaryOpen={audience.panelState.dietaryOpen}
        onDietaryOpenChange={audience.panelState.setDietaryOpen}
      />
      <BoxAudienceCategory
        eligibility={audience.eligibility}
        studyTaxonomyNodeId={draft.taxonomyNodeId}
        qualifyingNode={audience.referenceData.qualifyingNode}
        setQualifyingNode={audience.referenceData.setQualifyingNode}
        patch={audience.patch}
        categoryOpen={audience.panelState.categoryOpen}
        onCategoryOpenChange={audience.panelState.setCategoryOpen}
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
