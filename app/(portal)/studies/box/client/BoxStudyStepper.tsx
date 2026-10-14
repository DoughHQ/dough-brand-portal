import type { BoxValidity } from '@/lib/box/validity'
import { BOX_ANCHORS } from '@/lib/box/validity'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import BuilderStepper from '../../concept/BuilderStepper'

export default function BoxStudyStepper({ validity }: { validity: BoxValidity }) {
  return (
    <BuilderStepper
      label="Sampling box sections"
      steps={[
        { id: BOX_ANCHORS.setup, label: 'Setup', done: validity.setupOk },
        {
          id: BOX_ANCHORS.field,
          label: 'Field',
          done: validity.setupOk && validity.fieldOk,
        },
        {
          id: BOX_ANCHORS.risk,
          label: "What's inside",
          done: validity.riskOk,
        },
        {
          id: BOX_ANCHORS.method,
          label: 'Questions',
          done: validity.setupOk && validity.fieldOk,
        },
        ...(STUDY_AUDIENCE_BUILDER_ENABLED
          ? [
              {
                id: BOX_ANCHORS.audience,
                label: 'Audience',
                done: validity.setupOk && validity.fieldOk && validity.audienceOk,
              },
            ]
          : []),
      ]}
    />
  )
}
