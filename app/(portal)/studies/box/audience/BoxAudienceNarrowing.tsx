import NarrowingPanel from '@/components/studies/audience/NarrowingPanel'
import type {
  AudienceEligibility,
  PatchAudienceEligibility,
} from '@/components/studies/audience/types'
import type { DietaryFlagGroup } from '@/lib/studies/audience/dietaryFlags'
import { BOX_ANCHORS } from '@/lib/box/validity'

export default function BoxAudienceNarrowing({
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
      anchorId={BOX_ANCHORS.audienceStates}
      eligibility={eligibility}
      dietaryGroups={dietaryGroups}
      dietaryStatus={dietaryStatus}
      patch={patch}
      narrowOpen={narrowOpen}
      narrowSet={narrowSet}
      onNarrowOpenChange={onNarrowOpenChange}
      dietaryOpen={dietaryOpen}
      onDietaryOpenChange={onDietaryOpenChange}
      stateLabel="Ship-to states"
      stateHelp="Leave empty to ship anywhere."
      dietarySubject="Claimant"
      accountAgeHelp="Guards against fresh accounts made just to claim."
    />
  )
}
