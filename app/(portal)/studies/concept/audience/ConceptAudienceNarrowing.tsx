import NarrowingPanel from '@/components/studies/audience/NarrowingPanel'
import type {
  AudienceEligibility,
  PatchAudienceEligibility,
} from '@/components/studies/audience/types'
import type { DietaryFlagGroup } from '@/lib/studies/audience/dietaryFlags'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'

export default function ConceptAudienceNarrowing({
  eligibility,
  dietaryGroups,
  dietaryStatus,
  patch,
  narrowOpen,
  narrowSet,
  onNarrowOpenChange,
  dietaryOpen,
  onDietaryOpenChange,
}: {
  eligibility: AudienceEligibility
  dietaryGroups: DietaryFlagGroup[]
  dietaryStatus: 'loading' | 'ready' | 'error'
  patch: PatchAudienceEligibility
  narrowOpen: boolean
  narrowSet: boolean
  onNarrowOpenChange: (open: boolean) => void
  dietaryOpen: boolean
  onDietaryOpenChange: (open: boolean) => void
}) {
  return (
    <NarrowingPanel
      anchorId={CONCEPT_ANCHORS.audienceStates}
      eligibility={eligibility}
      dietaryGroups={dietaryGroups}
      dietaryStatus={dietaryStatus}
      patch={patch}
      narrowOpen={narrowOpen}
      narrowSet={narrowSet}
      onNarrowOpenChange={onNarrowOpenChange}
      dietaryOpen={dietaryOpen}
      onDietaryOpenChange={onDietaryOpenChange}
      stateLabel="US states"
      stateHelp="Leave empty to include respondents in any state."
      dietarySubject="Respondent"
      accountAgeHelp="Guards against fresh accounts."
    />
  )
}
