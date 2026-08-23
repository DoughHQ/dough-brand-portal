import { stateDisplayName } from '@/lib/box/usStates'
import type { ConceptEligibilityDraft, ConceptStudyDraft } from './types'

export function eligibilityBarsSet(e: ConceptEligibilityDraft): boolean {
  return (
    e.minCategoryBattles != null ||
    e.minCategoryTries != null ||
    e.minCategoryLevel != null
  )
}

export function hasNarrowAudienceFilters(draft: ConceptStudyDraft): boolean {
  const e = draft.eligibility
  return (
    e.targetStates.length > 0 ||
    e.targetCountries.length > 0 ||
    e.requiredDietaryFlags.length > 0 ||
    e.allowedGenders.length > 0 ||
    e.minAge != null ||
    e.maxAge != null ||
    e.minAccountAgeDays != null
  )
}

/** True when no audience restriction is set — empty filters are valid. */
export function isOpenAudience(draft: ConceptStudyDraft): boolean {
  const e = draft.eligibility
  return (
    e.targetStates.length === 0 &&
    e.targetCountries.length === 0 &&
    e.requiredDietaryFlags.length === 0 &&
    e.allowedGenders.length === 0 &&
    e.minAge == null &&
    e.maxAge == null &&
    e.minAccountAgeDays == null &&
    !eligibilityBarsSet(e)
  )
}

export function audienceSummaryChips(
  draft: ConceptStudyDraft,
  opts: {
    dietaryLabels?: Record<string, string>
    categoryLabel?: string | null
  } = {}
): string[] {
  const chips: string[] = []
  const e = draft.eligibility
  if (e.targetStates.length > 0) {
    chips.push(e.targetStates.map((s) => stateDisplayName(s)).join(', '))
  }
  for (const code of e.requiredDietaryFlags) {
    chips.push(opts.dietaryLabels?.[code] ?? code)
  }
  if (e.minAge != null && e.maxAge != null) {
    chips.push(`Age ${e.minAge}–${e.maxAge}`)
  } else if (e.minAge != null) {
    chips.push(`Age ${e.minAge}+`)
  } else if (e.maxAge != null) {
    chips.push(`Age ≤${e.maxAge}`)
  }
  if (e.minAccountAgeDays != null) {
    chips.push(`Account ${e.minAccountAgeDays}d+`)
  }

  const barsSet = eligibilityBarsSet(e)
  if (e.qualifyingTaxonomyNodeId != null && barsSet) {
    const name =
      opts.categoryLabel?.trim() ||
      e.qualifyingNodeLabel?.trim() ||
      'Category'
    const bits = [name]
    if (e.minCategoryLevel != null) bits.push(`L${e.minCategoryLevel}`)
    if (e.minCategoryTries != null) {
      bits.push(
        `${e.minCategoryTries} ${e.minCategoryTries === 1 ? 'loop' : 'loops'}`
      )
    }
    if (e.minCategoryBattles != null) {
      bits.push(
        `${e.minCategoryBattles} ${e.minCategoryBattles === 1 ? 'battle' : 'battles'}`
      )
    }
    chips.push(bits.join(' · '))
  }

  return chips
}
