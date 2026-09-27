import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft, createEmptyConceptEligibility } from '../defaults'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import { evaluateFieldValidity } from '../validity'

describe('concept audience validity', () => {
  it('allows an empty audience', () => {
    const draft = createEmptyConceptDraft({
      title: 'Test',
      stimulusMode: 'package',
      taxonomyNodeId: 1,
    })
    expect(evaluateFieldValidity(draft).audienceOk).toBe(true)
  })

  it(
    STUDY_AUDIENCE_BUILDER_ENABLED
      ? 'blocks publish when a category bar is set without a node'
      : 'V1: ignores audience rule gaps while the builder is off',
    () => {
      const draft = createEmptyConceptDraft({
        title: 'Test',
        stimulusMode: 'package',
        taxonomyNodeId: 1,
        eligibility: {
          ...createEmptyConceptEligibility(),
          minCategoryBattles: 5,
        },
      })
      const v = evaluateFieldValidity(draft)
      if (STUDY_AUDIENCE_BUILDER_ENABLED) {
        expect(v.audienceOk).toBe(false)
        expect(v.readyToPublish).toBe(false)
        expect(v.outstanding.some((o) => o.anchor === 'concept-aud-category-bars')).toBe(
          true
        )
      } else {
        expect(v.audienceOk).toBe(true)
        expect(v.outstanding.some((o) => o.anchor === 'concept-aud-category-bars')).toBe(
          false
        )
      }
    }
  )
})
