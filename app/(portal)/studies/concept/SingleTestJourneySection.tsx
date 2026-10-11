/**
 * Section 2 — single-test journey cards.
 */

'use client'

import type { ConceptStudyDraft } from '@/lib/concept/types'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import BuilderSectionChrome from './BuilderSectionChrome'
import JourneySectionHead from './journey/JourneySectionHead'
import JourneyStepList from './journey/JourneyStepList'
import JourneySuccessBlock from './journey/JourneySuccessBlock'
import { journeyLengthLabel } from './journey/journeyLabels'
import { useSingleTestJourney } from './journey/useSingleTestJourney'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  disabled?: boolean
  error?: string | null
  canPreview?: boolean
  onPreview?: () => void
  /** Collapse when the questionnaire is publish-ready. */
  sectionDone?: boolean
}

export default function SingleTestJourneySection({
  draft,
  onChange,
  disabled,
  error,
  canPreview = false,
  onPreview,
  sectionDone = false,
}: Props) {
  const state = useSingleTestJourney({ draft, onChange })
  const lengthLabel = journeyLengthLabel(state.journey)

  return (
    <BuilderSectionChrome
      id={CONCEPT_ANCHORS.questions}
      title="Questions"
      summary={lengthLabel ?? ''}
      done={sectionDone}
    >
      <JourneySectionHead
        lengthLabel={lengthLabel}
        journey={state.journey}
        journeyError={state.journeyError}
        canPreview={canPreview}
        onPreview={onPreview}
      />

      <div
        style={{ opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
      >
        <JourneyStepList draft={draft} onChange={onChange} error={error} state={state} />
        <JourneySuccessBlock draft={draft} state={state} />
      </div>
    </BuilderSectionChrome>
  )
}
