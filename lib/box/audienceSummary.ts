import { stateDisplayName } from './usStates'
import type { BoxStudyDraft } from './types'

export function hasNarrowAudienceFilters(draft: BoxStudyDraft): boolean {
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

export function audienceSummaryChips(
  draft: BoxStudyDraft,
  opts: {
    dietaryLabels?: Record<string, string>
    categoryLabel?: string | null
  } = {}
): string[] {
  const chips: string[] = []
  if (draft.eligibilityTier === 'tried') chips.push('Has tried this product')
  else if (draft.eligibilityTier === 'not_tried') {
    chips.push('Has not tried this product')
  }

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

  const barsSet =
    e.minCategoryBattles != null ||
    e.minCategoryTries != null ||
    e.minCategoryLevel != null
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
