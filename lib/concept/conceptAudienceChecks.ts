import { eligibilityBarsSet } from './audienceSummary'
import { createEmptyConceptEligibility } from './defaults'
import type { ConceptStudyDraft } from './types'
import { STUDY_AUDIENCE_BUILDER_ENABLED } from '@/lib/studies/features'
import { CONCEPT_ANCHORS, type OutstandingItem } from './validity'

export function collectConceptAudienceIssues(
  draft: ConceptStudyDraft,
  reasons: string[],
  outstanding: OutstandingItem[],
  softOutstanding: OutstandingItem[],
): boolean {
  // ---- audience --------------------------------------------------------
  // V1: audience builder is off — every study is open. Skip client gates and
  // do not push audience outstanding items. Publish omits p_eligibility.
  let audienceOk = true
  if (STUDY_AUDIENCE_BUILDER_ENABLED) {
    const e = draft.eligibility ?? createEmptyConceptEligibility()
    const barsSet = eligibilityBarsSet(e)

    const barsNodeOk = !barsSet || e.qualifyingTaxonomyNodeId != null
    if (!barsNodeOk) {
      const msg =
        'Category requirements need a qualifying category. Pick one, or clear the bars.'
      reasons.push(msg)
      outstanding.push({
        message: msg,
        anchor: CONCEPT_ANCHORS.audienceCategoryBars,
      })
    }

    const levelOk =
      e.minCategoryLevel == null ||
      (e.minCategoryLevel >= 1 && e.minCategoryLevel <= 20)
    if (!levelOk) {
      const msg = 'Category level must be between 1 and 20.'
      reasons.push(msg)
      outstanding.push({
        message: msg,
        anchor: CONCEPT_ANCHORS.audienceCategoryBars,
      })
    }

    const barsNonNegOk =
      (e.minCategoryBattles == null || e.minCategoryBattles >= 0) &&
      (e.minCategoryTries == null || e.minCategoryTries >= 0)
    if (!barsNonNegOk) {
      const msg = 'Category requirements cannot be negative.'
      reasons.push(msg)
      outstanding.push({
        message: msg,
        anchor: CONCEPT_ANCHORS.audienceCategoryBars,
      })
    }

    const ageOk = e.minAge == null || e.maxAge == null || e.minAge <= e.maxAge
    if (!ageOk) {
      const msg = 'Minimum age cannot exceed maximum age.'
      reasons.push(msg)
      outstanding.push({ message: msg, anchor: CONCEPT_ANCHORS.audience })
    }

    const statesFormatOk = e.targetStates.every((s) => s.trim().length > 0)
    if (!statesFormatOk) {
      const msg = 'Remove the empty state entry.'
      reasons.push(msg)
      outstanding.push({ message: msg, anchor: CONCEPT_ANCHORS.audienceStates })
    }

    audienceOk = barsNodeOk && levelOk && barsNonNegOk && ageOk && statesFormatOk

    if (e.qualifyingTaxonomyNodeId != null && !barsSet) {
      softOutstanding.push({
        message:
          'Category expertise needs a bar (level, tries, or battles) or it won’t restrict who can take the study.',
        anchor: CONCEPT_ANCHORS.audienceCategoryBars,
      })
    }
  }
  return audienceOk
}
