import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft, createEmptyConceptEligibility } from '../defaults'
import { evaluateFieldValidity } from '../validity'

describe('concept audience validity', () => {
  it('blocks publish when a category bar is set without a node', () => {
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
    expect(v.audienceOk).toBe(false)
    expect(v.readyToPublish).toBe(false)
    expect(v.outstanding.some((o) => o.anchor === 'concept-aud-category-bars')).toBe(
      true
    )
  })

  it('allows an empty audience', () => {
    const draft = createEmptyConceptDraft({
      title: 'Test',
      stimulusMode: 'package',
      taxonomyNodeId: 1,
    })
    expect(evaluateFieldValidity(draft).audienceOk).toBe(true)
  })
})
