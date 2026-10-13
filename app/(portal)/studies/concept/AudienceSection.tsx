'use client'

import AudienceSummary from '@/components/studies/audience/AudienceSummary'
import { isOpenAudience } from '@/lib/concept/audienceSummary'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import { sectionCard } from './conceptStyles'
import ConceptAudienceCategory from './audience/ConceptAudienceCategory'
import ConceptAudienceHead from './audience/ConceptAudienceHead'
import ConceptAudienceLocked from './audience/ConceptAudienceLocked'
import ConceptAudienceNarrowing from './audience/ConceptAudienceNarrowing'
import { useConceptAudience } from './audience/useConceptAudience'

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
  const audience = useConceptAudience(draft, onChange)

  return (
    <section
      id={CONCEPT_ANCHORS.audience}
      style={{
        ...sectionCard,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <ConceptAudienceHead />
      <AudienceSummary
        open={isOpenAudience(draft)}
        chips={audience.summaryChips}
      />
      {disabled && disabledReason ? (
        <ConceptAudienceLocked reason={disabledReason} />
      ) : null}
      <ConceptAudienceNarrowing
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
      <ConceptAudienceCategory
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
    </section>
  )
}
