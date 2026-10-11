import { CONCEPT_ANCHORS, type FieldValidity } from '@/lib/concept/validity'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import BuilderStepper from '../BuilderStepper'

export default function ConceptStudyStepper({
  validity,
  setupDone,
  fieldDone,
  questionsDone,
}: {
  validity: FieldValidity
  setupDone: boolean
  fieldDone: boolean
  questionsDone: boolean
}) {
  return (
    <BuilderStepper
      label="Concept study sections"
      steps={[
        { id: CONCEPT_ANCHORS.mode, label: 'Setup', done: setupDone },
        {
          id: CONCEPT_ANCHORS.field,
          label: 'Field',
          done: setupDone && fieldDone,
        },
        {
          id: CONCEPT_ANCHORS.questions,
          label: 'Questionnaire',
          done: setupDone && fieldDone && questionsDone,
        },
        ...(STUDY_AUDIENCE_BUILDER_ENABLED
          ? [
              {
                id: CONCEPT_ANCHORS.audience,
                label: 'Audience',
                done: setupDone && fieldDone && questionsDone && validity.audienceOk,
              },
            ]
          : []),
      ]}
    />
  )
}
